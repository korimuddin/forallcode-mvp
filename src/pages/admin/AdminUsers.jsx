import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import IllustratedAvatar from "../../components/ui/IllustratedAvatar";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 25;

export default function AdminUsers() {
  useDocumentTitle("Users admin · ForAllCode");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(0);
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [search, planFilter, sort]);

  useEffect(() => {
    let alive = true;

    async function loadUsers() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        let query = supabase
          .from("profiles")
          .select("id, username, display_name, github_username, avatar_url, avatar_style, created_at, updated_at, is_suspended", { count: "exact" });

        if (search.trim()) {
          const term = `%${search.trim()}%`;
          query = query.or(`username.ilike.${term},display_name.ilike.${term},github_username.ilike.${term}`);
        }

        if (sort === "oldest") query = query.order("created_at", { ascending: true });
        if (sort === "newest") query = query.order("created_at", { ascending: false });
        if (sort === "active") query = query.order("updated_at", { ascending: false, nullsFirst: false });

        const { data: profileRows, count, error: profileError } = await query.range(from, to);
        if (profileError) throw profileError;

        const userIds = (profileRows || []).map((user) => user.id);
        const [subscriptions, repoRows, lessonRows] = userIds.length ? await Promise.all([
          supabase.from("subscriptions").select("user_id, plan_id, status, current_period_end").in("user_id", userIds),
          supabase.from("repositories").select("owner_id").in("owner_id", userIds),
          supabase.from("learn_progress").select("user_id").eq("completed", true).in("user_id", userIds)
        ]) : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null }
        ];

        const relatedError = subscriptions.error || repoRows.error || lessonRows.error;
        if (relatedError) throw relatedError;
        if (!alive) return;

        const subscriptionByUser = new Map((subscriptions.data || []).map((item) => [item.user_id, item]));
        const reposByUser = countByKey(repoRows.data || [], "owner_id");
        const lessonsByUser = countByKey(lessonRows.data || [], "user_id");

        const enriched = (profileRows || []).map((profile) => {
          const subscription = subscriptionByUser.get(profile.id);
          return {
            ...profile,
            plan: subscription?.plan_id || "free",
            subscriptionStatus: subscription?.status || "active",
            repos: reposByUser.get(profile.id) || 0,
            lessons: lessonsByUser.get(profile.id) || 0
          };
        });

        setUsers(planFilter === "all" ? enriched : enriched.filter((user) => user.plan === planFilter));
        setTotal(count || 0);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load users.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      alive = false;
    };
  }, [page, search, planFilter, sort]);

  const columns = useMemo(() => ([
    {
      key: "username",
      label: "User",
      render: (_value, row) => (
        <div className="admin-user-cell">
          {row.avatar_url ? (
            <img className="admin-user-avatar" src={row.avatar_url} alt="" />
          ) : (
            <IllustratedAvatar variant={row.avatar_style || "sage"} size={34} />
          )}
          <div>
            <strong className="admin-table-primary">{row.display_name || row.username || "Unnamed user"}</strong>
            <span className="admin-table-secondary">@{row.username || row.github_username || "unknown"}</span>
          </div>
        </div>
      )
    },
    {
      key: "github_username",
      label: "Email",
      render: (value) => <span className="admin-mono-value">{value ? `GitHub: @${value}` : "Not stored"}</span>
    },
    {
      key: "plan",
      label: "Plan",
      width: "90px",
      render: (value) => <StatusBadge status={value || "free"} />
    },
    { key: "repos", label: "Repos", width: "80px" },
    { key: "lessons", label: "Lessons", width: "90px" },
    {
      key: "created_at",
      label: "Joined",
      width: "130px",
      render: (value) => value ? new Date(value).toLocaleDateString("en-GB") : "Unknown"
    },
    {
      key: "updated_at",
      label: "Last active",
      width: "150px",
      render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "Unknown"
    },
    {
      key: "id",
      label: "Actions",
      width: "92px",
      render: (_value, row) => (
        <div className="admin-row-actions">
          <button
            aria-label={`Open actions for ${row.username}`}
            className="admin-action-trigger"
            disabled={busyUserId === row.id}
            onClick={(event) => {
              event.stopPropagation();
              setOpenMenuId((current) => current === row.id ? "" : row.id);
            }}
            type="button"
          >
            <MoreHorizontal size={16} />
          </button>
          {openMenuId === row.id && (
            <div className="admin-action-menu" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => navigate(`/admin/users/${row.id}`)} type="button">View profile</button>
              <button onClick={() => updatePlan(row.id, "pro")} type="button">Upgrade to Pro</button>
              <button onClick={() => updatePlan(row.id, "free")} type="button">Downgrade to Free</button>
              <button onClick={() => toggleSuspension(row)} type="button">
                {row.is_suspended ? "Unsuspend account" : "Suspend account"}
              </button>
              <button className="danger" onClick={() => deleteUser(row)} type="button">Delete account</button>
            </div>
          )}
        </div>
      )
    }
  ]), [busyUserId, navigate, openMenuId]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingEnd = Math.min(total, (page + 1) * PAGE_SIZE);

  async function updatePlan(userId, plan) {
    setBusyUserId(userId);
    setError("");
    try {
      const { error: planError } = await supabase
        .from("subscriptions")
        .upsert({ user_id: userId, plan_id: plan, status: "active", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (planError) throw planError;
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, plan, subscriptionStatus: "active" } : user));
      setOpenMenuId("");
    } catch (planError) {
      setError(planError.message || "Could not update the user's plan.");
    } finally {
      setBusyUserId("");
    }
  }

  async function toggleSuspension(user) {
    setBusyUserId(user.id);
    setError("");
    try {
      const { error: suspendError } = await supabase
        .from("profiles")
        .update({ is_suspended: !user.is_suspended })
        .eq("id", user.id);
      if (suspendError) throw suspendError;
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_suspended: !item.is_suspended } : item));
      setOpenMenuId("");
    } catch (suspendError) {
      setError(suspendError.message || "Could not update suspension status.");
    } finally {
      setBusyUserId("");
    }
  }

  async function deleteUser(user) {
    const label = user.username || user.id;
    if (!window.confirm(`Delete @${label}? This removes their ForAllCode profile data and cannot be undone.`)) return;
    setBusyUserId(user.id);
    setError("");
    try {
      await deleteUserData(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setTotal((current) => Math.max(0, current - 1));
      setOpenMenuId("");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the user.");
    } finally {
      setBusyUserId("");
    }
  }

  function exportUsersCSV() {
    const headers = ["username", "github_username", "plan", "repos", "lessons", "joined", "last_active", "is_suspended"];
    const rows = users.map((user) => [
      user.username || "",
      user.github_username || "",
      user.plan || "free",
      user.repos,
      user.lessons,
      user.created_at || "",
      user.updated_at || "",
      user.is_suspended ? "true" : "false"
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forallcode-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-users-page">
      <AdminPageHeader
        title="Users"
        subtitle="All registered accounts, plans, and account status."
        action={<button className="admin-secondary-button" onClick={exportUsersCSV} type="button">Export CSV</button>}
      />

      <div className="admin-filter-row">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search by name, username, GitHub" />
        <select className="admin-select" value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
          <option value="all">Plan: All</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <select className="admin-select" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Oldest</option>
          <option value="active">Most active</option>
        </select>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <Skeleton className="admin-users-table-skeleton" />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          emptyMessage="No users match these filters"
          onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
        />
      )}

      <div className="admin-pagination-row">
        <span>Showing {showingStart}-{showingEnd} of {total} users</span>
        <div>
          <button disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} type="button">Previous</button>
          <label>
            Page
            <input
              min="1"
              max={pageCount}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next)) setPage(Math.min(pageCount - 1, Math.max(0, next - 1)));
              }}
              type="number"
              value={page + 1}
            />
            of {pageCount}
          </label>
          <button disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} type="button">Next</button>
        </div>
      </div>
    </div>
  );
}

function countByKey(rows, key) {
  const counts = new Map();
  rows.forEach((row) => counts.set(row[key], (counts.get(row[key]) || 0) + 1));
  return counts;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function deleteUserData(userId) {
  const deletes = [
    supabase.from("notifications").delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`),
    supabase.from("stars").delete().eq("user_id", userId),
    supabase.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
    supabase.from("learn_progress").delete().eq("user_id", userId),
    supabase.from("usage_events").delete().eq("user_id", userId),
    supabase.from("upgrade_feedback").delete().eq("user_id", userId),
    supabase.from("subscriptions").delete().eq("user_id", userId),
    supabase.from("workspace_notes").delete().eq("user_id", userId),
    supabase.from("workspace_todos").delete().eq("user_id", userId),
    supabase.from("workspace_settings").delete().eq("user_id", userId),
    supabase.from("repositories").delete().eq("owner_id", userId),
    supabase.from("profiles").delete().eq("id", userId)
  ];

  const results = await Promise.all(deletes);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
}
