import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AdminChart, { ADMIN_CHART_COLORS } from "../../components/admin/AdminChart";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

export default function AdminNotifications() {
  useDocumentTitle("Notifications admin · ForAllCode");
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [recipientMode, setRecipientMode] = useState("all");
  const [recipient, setRecipient] = useState("");
  const [messageType, setMessageType] = useState("system");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadNotifications() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [notificationsResult, usersResult] = await Promise.all([
          supabase
            .from("notifications")
            .select("id, user_id, actor_id, repo_id, type, message, read, created_at, recipient:profiles!notifications_user_id_fkey(username, display_name), actor:profiles!notifications_actor_id_fkey(username, display_name)")
            .order("created_at", { ascending: false })
            .limit(250),
          supabase
            .from("profiles")
            .select("id, username, display_name")
            .order("username", { ascending: true })
            .limit(5000)
        ]);

        const queryError = notificationsResult.error || usersResult.error;
        if (queryError) throw queryError;
        if (!alive) return;
        setNotifications(notificationsResult.data || []);
        setUsers(usersResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load notifications.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      alive = false;
    };
  }, []);

  const filteredNotifications = useMemo(() => notifications.filter((item) => {
    if (filter === "read" && !item.read) return false;
    if (filter === "unread" && item.read) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (!search.trim()) return true;
    const haystack = `${item.message || ""} ${item.recipient?.username || ""} ${item.actor?.username || ""} ${item.type || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }), [filter, notifications, search, typeFilter]);

  const sentToday = notifications.filter((item) => isToday(item.created_at)).length;
  const unreadTotal = notifications.filter((item) => !item.read).length;
  const readRate = notifications.length
    ? Math.round((notifications.filter((item) => item.read).length / notifications.length) * 100)
    : 0;
  const typeData = useMemo(() => {
    const counts = new Map();
    notifications.forEach((item) => counts.set(item.type, (counts.get(item.type) || 0) + 1));
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [notifications]);
  const typeOptions = Array.from(new Set(notifications.map((item) => item.type).filter(Boolean))).sort();

  const columns = useMemo(() => ([
    {
      key: "type",
      label: "Type",
      width: "150px",
      render: (value) => <StatusBadge status={value || "system"} />
    },
    {
      key: "recipient",
      label: "To user",
      width: "160px",
      render: (value) => `@${value?.username || "unknown"}`
    },
    {
      key: "actor",
      label: "From user",
      width: "160px",
      render: (value) => value?.username ? `@${value.username}` : "System"
    },
    {
      key: "message",
      label: "Message",
      render: (value) => value || "No message"
    },
    {
      key: "created_at",
      label: "Sent",
      width: "150px",
      render: (value) => formatDistanceToNow(new Date(value), { addSuffix: true })
    },
    {
      key: "read",
      label: "Read",
      width: "80px",
      render: (value) => value ? "✓" : "✗"
    }
  ]), []);

  async function markAllRead() {
    setError("");
    const ids = filteredNotifications.map((item) => item.id);
    if (!ids.length) return;
    const { error: updateError } = await supabase.from("notifications").update({ read: true }).in("id", ids);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, read: true } : item));
  }

  async function deleteOldNotifications() {
    if (!window.confirm("Delete notifications older than 90 days?")) return;
    setError("");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const { error: deleteError } = await supabase.from("notifications").delete().lt("created_at", cutoff.toISOString());
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setNotifications((current) => current.filter((item) => new Date(item.created_at) >= cutoff));
  }

  async function sendSystemNotification(event) {
    event.preventDefault();
    if (!message.trim()) {
      setError("Write a message before sending.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const recipients = recipientMode === "all"
        ? users
        : users.filter((user) => user.username?.toLowerCase() === recipient.trim().replace(/^@/, "").toLowerCase());

      if (!recipients.length) throw new Error("No matching recipients found.");

      const rows = recipients.map((user) => ({
        user_id: user.id,
        type: messageType,
        message: message.trim()
      }));

      const { data, error: insertError } = await supabase.from("notifications").insert(rows).select("id, user_id, actor_id, repo_id, type, message, read, created_at");
      if (insertError) throw insertError;

      const usersById = new Map(users.map((user) => [user.id, user]));
      setNotifications((current) => [
        ...(data || []).map((item) => ({ ...item, recipient: usersById.get(item.user_id), actor: null })),
        ...current
      ]);
      setMessage("");
      setRecipient("");
    } catch (sendError) {
      setError(sendError.message || "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-notifications-page">
      <AdminPageHeader title="Notifications" subtitle="Inspect in-app notifications and broadcast system messages." />
      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <Skeleton className="admin-users-table-skeleton" />
      ) : (
        <>
          <section className="admin-stat-grid">
            <StatCard label="Sent today" value={sentToday} accent="#9b8fd4" />
            <StatCard label="Read rate" value={`${readRate}%`} accent="#7aaa72" />
            <StatCard label="Unread total" value={unreadTotal} accent="#c8a055" />
            <StatCard label="Failed" value="0" accent="#d4848c" />
          </section>

          <section className="admin-chart-grid">
            <AdminChart title="Notification type breakdown" subtitle="Latest 250 notifications" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#f4efe6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis type="category" dataKey="type" width={130} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="count" fill={ADMIN_CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChart>

            <section className="admin-panel">
              <h2>Send system notification</h2>
              <form className="admin-notification-form" onSubmit={sendSystemNotification}>
                <div className="admin-radio-row">
                  <label><input checked={recipientMode === "all"} onChange={() => setRecipientMode("all")} type="radio" /> All users</label>
                  <label><input checked={recipientMode === "specific"} onChange={() => setRecipientMode("specific")} type="radio" /> Specific user</label>
                </div>
                {recipientMode === "specific" && (
                  <input placeholder="username" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
                )}
                <select value={messageType} onChange={(event) => setMessageType(event.target.value)}>
                  <option value="system">system</option>
                  <option value="announcement">announcement</option>
                  <option value="maintenance">maintenance</option>
                </select>
                <textarea placeholder="Message" value={message} onChange={(event) => setMessage(event.target.value)} />
                <button className="admin-save-button" disabled={sending} type="submit">{sending ? "Sending..." : "Send notification"}</button>
              </form>
            </section>
          </section>

          <div className="admin-filter-row">
            <AdminSearchBar value={search} onChange={setSearch} placeholder="Search notifications" />
            <select className="admin-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <select className="admin-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <button className="admin-secondary-button" onClick={markAllRead} type="button">Mark visible as read</button>
            <button className="admin-secondary-button" onClick={deleteOldNotifications} type="button">Delete old</button>
          </div>

          <DataTable columns={columns} data={filteredNotifications} emptyMessage="No notifications match these filters" />
        </>
      )}
    </div>
  );
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}
