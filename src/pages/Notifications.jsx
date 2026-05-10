import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import IllustratedAvatar from "../components/ui/IllustratedAvatar";
import { useDocumentTitle } from "../lib/hooks";
import { getCurrentSession, supabase } from "../lib/supabase";

const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Stars", value: "star" },
  { label: "Follows", value: "follow" }
];

export default function Notifications() {
  useDocumentTitle("Notifications");
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    async function loadNotifications() {
      if (!supabase) return;
      const currentSession = await getCurrentSession();
      setSession(currentSession);
      if (!currentSession?.user?.id) return;

      const { data } = await supabase
        .from("notifications")
        .select("*, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_style)")
        .eq("user_id", currentSession.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data?.length) setItems(data);
    }

    loadNotifications();
  }, []);

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unread") return items.filter((item) => !item.read);
    return items.filter((item) => item.type === activeFilter);
  }, [activeFilter, items]);

  async function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    if (!supabase || !session?.user?.id) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.user.id)
      .eq("read", false);
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Recent stars, follows, comments, and ForAllCode updates.</p>
        </div>
        <button className="button soft" onClick={markAllRead} type="button">Mark all as read</button>
      </header>

      <div className="notifications-filter-tabs">
        {filters.map((filter) => (
          <button className={activeFilter === filter.value ? "active" : ""} key={filter.value} onClick={() => setActiveFilter(filter.value)} type="button">
            {filter.label}
          </button>
        ))}
      </div>

      <section className="notifications-list">
        {visibleItems.map((notification) => <NotificationCard key={notification.id} notification={notification} />)}
        {visibleItems.length === 0 && <p className="notifications-empty">Nothing here yet.</p>}
      </section>
    </main>
  );
}

function NotificationCard({ notification }) {
  const actor = notification.actor || {};
  return (
    <article className={`notification-card ${notification.read ? "" : "unread"}`}>
      <IllustratedAvatar size={42} variant={actor.avatar_style || "sage"} />
      <div>
        <p>{notification.message}</p>
        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
      </div>
    </article>
  );
}
