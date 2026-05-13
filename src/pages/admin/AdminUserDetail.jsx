import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import IllustratedAvatar from "../../components/ui/IllustratedAvatar";
import Skeleton from "../../components/ui/Skeleton";
import { learnLessons } from "../../data/learnLessons";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({ repos: 0, lessons: 0, notes: 0, todos: 0, stars: 0 });
  const [notifications, setNotifications] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useDocumentTitle(profile?.username ? `${profile.username} admin` : "User detail admin");

  useEffect(() => {
    let alive = true;

    async function loadUser() {
      if (!supabase || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          profileResult,
          subscriptionResult,
          repoCount,
          lessonCount,
          noteCount,
          todoCount,
          starCount,
          notificationResult,
          progressResult
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, display_name, github_username, bio, location, website, avatar_url, avatar_style, created_at, updated_at, is_suspended, learn_comfort_level")
            .eq("id", id)
            .single(),
          supabase
            .from("subscriptions")
            .select("plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end")
            .eq("user_id", id)
            .maybeSingle(),
          countRows("repositories", "owner_id", id),
          countRows("learn_progress", "user_id", id, (query) => query.eq("completed", true)),
          countRows("workspace_notes", "user_id", id),
          countRows("workspace_todos", "user_id", id),
          countRows("stars", "user_id", id),
          supabase
            .from("notifications")
            .select("id, type, message, read, created_at")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("learn_progress")
            .select("lesson_slug, completed, completed_at")
            .eq("user_id", id)
            .order("completed_at", { ascending: false, nullsFirst: false })
            .limit(12)
        ]);

        const queryError = profileResult.error
          || subscriptionResult.error
          || notificationResult.error
          || progressResult.error;
        if (queryError) throw queryError;

        if (!alive) return;
        setProfile(profileResult.data);
        setSubscription(subscriptionResult.data || { plan_id: "free", status: "active" });
        setStats({
          repos: repoCount,
          lessons: lessonCount,
          notes: noteCount,
          todos: todoCount,
          stars: starCount
        });
        setNotifications(notificationResult.data || []);
        setProgress(progressResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load this user.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadUser();
    return () => {
      alive = false;
    };
  }, [id]);

  const progressColumns = useMemo(() => ([
    {
      key: "lesson_slug",
      label: "Lesson",
      render: (value) => lessonTitle(value)
    },
    {
      key: "completed",
      label: "Status",
      width: "120px",
      render: (value) => <StatusBadge status={value ? "active" : "degraded"} />
    },
    {
      key: "completed_at",
      label: "Completed",
      width: "160px",
      render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "Not yet"
    }
  ]), []);

  async function toggleSuspension() {
    if (!profile) return;
    setBusy(true);
    setError("");
    try {
      const { error: suspendError } = await supabase
        .from("profiles")
        .update({ is_suspended: !profile.is_suspended })
        .eq("id", profile.id);
      if (suspendError) throw suspendError;
      setProfile((current) => ({ ...current, is_suspended: !current.is_suspended }));
    } catch (suspendError) {
      setError(suspendError.message || "Could not update suspension status.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser() {
    if (!profile) return;
    if (!window.confirm(`Delete @${profile.username}? This removes their ForAllCode profile data and cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await deleteUserData(profile.id);
      navigate("/admin/users");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this user.");
    } finally {
      setBusy(false);
    }
  }

  function impersonateUser() {
    if (!profile?.id) return;
    window.sessionStorage.setItem("impersonating_user_id", profile.id);
    window.sessionStorage.setItem("impersonating_username", profile.username || profile.display_name || "user");
    window.location.href = "/dashboard";
  }

  if (loading) {
    return (
      <div className="admin-user-detail-page">
        <Skeleton className="admin-skeleton-card" />
        <Skeleton className="admin-skeleton-chart" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-user-detail-page">
        <Link className="admin-back-inline" to="/admin/users"><ArrowLeft size={15} /> Back to users</Link>
        <p className="auth-error">{error || "User not found."}</p>
      </div>
    );
  }

  return (
    <div className="admin-user-detail-page">
      <Link className="admin-back-inline" to="/admin/users"><ArrowLeft size={15} /> Back to users</Link>
      <AdminPageHeader
        title={profile.display_name || profile.username || "User detail"}
        subtitle={`@${profile.username || profile.github_username || "unknown"} · Joined ${formatDate(profile.created_at)}`}
        action={<button className="admin-secondary-button" onClick={impersonateUser} type="button">View app as this user</button>}
      />

      {error && <p className="auth-error">{error}</p>}

      <section className="admin-user-hero">
        {profile.avatar_url ? (
          <img className="admin-user-detail-avatar" src={profile.avatar_url} alt="" />
        ) : (
          <IllustratedAvatar variant={profile.avatar_style || "sage"} size={76} />
        )}
        <div>
          <h2>{profile.display_name || profile.username}</h2>
          <p>@{profile.username || profile.github_username || "unknown"}</p>
          <div className="admin-user-badges">
            <StatusBadge status={subscription?.plan_id || "free"} />
            <StatusBadge status={profile.is_suspended ? "suspended" : subscription?.status || "active"} />
          </div>
        </div>
      </section>

      <section className="admin-detail-grid">
        <div className="admin-detail-stack">
          <AdminPanel title="Account details">
            <dl className="admin-detail-list">
              <div><dt>Plan</dt><dd>{subscription?.plan_id || "free"}</dd></div>
              <div><dt>Subscription status</dt><dd>{subscription?.status || "active"}</dd></div>
              <div><dt>Stripe customer</dt><dd className="admin-mono-value">{subscription?.stripe_customer_id || "Not linked"}</dd></div>
              <div><dt>Stripe subscription</dt><dd className="admin-mono-value">{subscription?.stripe_subscription_id || "Not linked"}</dd></div>
              <div><dt>Current period</dt><dd>{formatDate(subscription?.current_period_start)} - {formatDate(subscription?.current_period_end)}</dd></div>
              <div><dt>Last active</dt><dd>{profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : "Unknown"}</dd></div>
            </dl>
          </AdminPanel>

          <AdminPanel title="Danger zone" danger>
            <p className="admin-panel-muted">Suspending hides this account from normal activity until it is restored. Deleting removes ForAllCode profile data.</p>
            <div className="admin-danger-actions">
              <button className="admin-secondary-button" disabled={busy} onClick={toggleSuspension} type="button">
                {profile.is_suspended ? "Unsuspend account" : "Suspend account"}
              </button>
              <button className="admin-delete-button" disabled={busy} onClick={deleteUser} type="button">Delete account</button>
            </div>
          </AdminPanel>
        </div>

        <div className="admin-detail-stack">
          <section className="admin-stat-grid compact">
            <StatCard label="Repos" value={stats.repos} accent="#9b8fd4" />
            <StatCard label="Lessons" value={stats.lessons} accent="#7aaa72" />
            <StatCard label="Notes" value={stats.notes} accent="#c8a055" />
            <StatCard label="Stars" value={stats.stars} accent="#6aa8d4" />
          </section>

          <AdminPanel title="Recent activity">
            {notifications.length === 0 ? (
              <p className="admin-panel-muted">No notifications yet.</p>
            ) : (
              <div className="admin-activity-list">
                {notifications.map((item) => (
                  <article key={item.id}>
                    <StatusBadge status={item.read ? "free" : "active"} />
                    <div>
                      <p>{item.message || item.type}</p>
                      <time>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</time>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AdminPanel>

          <AdminPanel title="Learn progress">
            <DataTable columns={progressColumns} data={progress} emptyMessage="No lessons started yet" />
          </AdminPanel>
        </div>
      </section>
    </div>
  );
}

function AdminPanel({ title, children, danger = false }) {
  return (
    <section className={danger ? "admin-panel danger" : "admin-panel"}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

async function countRows(table, column, value, buildQuery = (query) => query) {
  const { count, error } = await buildQuery(
    supabase.from(table).select("*", { count: "exact", head: true }).eq(column, value)
  );
  if (error) throw error;
  return count || 0;
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function lessonTitle(slug) {
  return learnLessons.find((lesson) => lesson.slug === slug)?.title || slug;
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
