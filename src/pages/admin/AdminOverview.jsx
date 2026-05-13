import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AdminChart, { ADMIN_CHART_COLORS } from "../../components/admin/AdminChart";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { learnLessons, learnTracks } from "../../data/learnLessons";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
});

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function dayKey(dateInput) {
  return new Date(dateInput).toISOString().slice(0, 10);
}

function shortDate(dateInput) {
  return new Date(dateInput).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

async function countRows(table, buildQuery = (query) => query) {
  const query = buildQuery(supabase.from(table).select("*", { count: "exact", head: true }));
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export default function AdminOverview() {
  useDocumentTitle("Admin overview · ForAllCode");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    users: 0,
    newToday: 0,
    activeToday: 0,
    lessonsCompleted: 0,
    mrr: 0,
    proUsers: 0,
    cancellations: 0,
    failedPayments: 0
  });
  const [growthData, setGrowthData] = useState([]);
  const [trackData, setTrackData] = useState([]);
  const [recentSignups, setRecentSignups] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    supabase: "online",
    stripe: "degraded",
    netlify: "online",
    stripeLabel: "No webhook received yet"
  });

  useEffect(() => {
    let alive = true;

    async function loadOverview() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const today = startOfTodayIso();
        const thirtyDaysAgo = daysAgoIso(29);

        const [
          userCount,
          newUsersToday,
          activeToday,
          lessonCompletions,
          proSubCount,
          cancellationCount,
          pastDueCount,
          recentProfiles,
          recentSubscriptions,
          growthProfiles,
          completedLessons,
          statusRows
        ] = await Promise.all([
          countRows("profiles"),
          countRows("profiles", (query) => query.gte("created_at", today)),
          countRows("profiles", (query) => query.gte("updated_at", today)),
          countRows("learn_progress", (query) => query.eq("completed", true)),
          countRows("subscriptions", (query) => query.eq("plan_id", "pro").eq("status", "active")),
          countRows("subscriptions", (query) => query.eq("cancel_at_period_end", true)),
          countRows("subscriptions", (query) => query.eq("status", "past_due")),
          supabase
            .from("profiles")
            .select("id, username, display_name, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("subscriptions")
            .select("user_id, plan_id, status"),
          supabase
            .from("profiles")
            .select("created_at")
            .gte("created_at", thirtyDaysAgo)
            .order("created_at", { ascending: true })
            .limit(5000),
          supabase
            .from("learn_progress")
            .select("lesson_slug")
            .eq("completed", true)
            .limit(5000),
          supabase
            .from("system_status")
            .select("key, value, updated_at")
        ]);

        const queryErrors = [
          recentProfiles.error,
          recentSubscriptions.error,
          growthProfiles.error,
          completedLessons.error,
          statusRows.error
        ].filter(Boolean);

        if (queryErrors.length) throw queryErrors[0];

        if (!alive) return;

        const subscriptionsByUser = new Map((recentSubscriptions.data || []).map((item) => [item.user_id, item]));
        const planPrice = 10;
        const statusByKey = new Map((statusRows.data || []).map((item) => [item.key, item]));
        const lastWebhook = statusByKey.get("stripe_webhook_last_received_at") || statusByKey.get("stripe_webhook");

        setStats({
          users: userCount,
          newToday: newUsersToday,
          activeToday,
          lessonsCompleted: lessonCompletions,
          mrr: proSubCount * planPrice,
          proUsers: proSubCount,
          cancellations: cancellationCount,
          failedPayments: pastDueCount
        });

        setRecentSignups((recentProfiles.data || []).map((profile) => {
          const subscription = subscriptionsByUser.get(profile.id);
          return {
            ...profile,
            plan: subscription?.plan_id || "free",
            status: subscription?.status || "active",
            joined: profile.created_at
          };
        }));

        setGrowthData(buildGrowthData(growthProfiles.data || []));
        setTrackData(buildTrackCompletionData(completedLessons.data || []));
        setSystemStatus({
          supabase: "online",
          stripe: lastWebhook?.value ? "online" : "degraded",
          netlify: "online",
          stripeLabel: lastWebhook?.value
            ? `Last webhook ${formatDistanceToNow(new Date(lastWebhook.value), { addSuffix: true })}`
            : "No webhook received yet"
        });
      } catch (overviewError) {
        if (!alive) return;
        setError(overviewError.message || "Could not load admin overview.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      alive = false;
    };
  }, []);

  const recentColumns = useMemo(() => ([
    {
      key: "username",
      label: "Username",
      render: (value, row) => (
        <div>
          <strong className="admin-table-primary">{row.display_name || value || "Unnamed user"}</strong>
          <span className="admin-table-secondary">@{value || "unknown"}</span>
        </div>
      )
    },
    {
      key: "plan",
      label: "Plan",
      width: "110px",
      render: (value) => <StatusBadge status={value || "free"} />
    },
    {
      key: "status",
      label: "Status",
      width: "120px",
      render: (value) => <StatusBadge status={value || "active"} />
    },
    {
      key: "joined",
      label: "Joined",
      width: "170px",
      render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "Unknown"
    }
  ]), []);

  return (
    <div className="admin-overview-page">
      <AdminPageHeader
        title="Overview"
        subtitle="Platform metrics, revenue signals, and system health."
      />

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <AdminOverviewSkeleton />
      ) : (
        <>
          <section className="admin-stat-grid">
            <StatCard label="Total users" value={stats.users} accent="#9b8fd4" />
            <StatCard label="New today" value={stats.newToday} accent="#7aaa72" />
            <StatCard label="Active today" value={stats.activeToday} accent="#6aa8d4" />
            <StatCard label="Lessons completed" value={stats.lessonsCompleted} accent="#c8a055" />
          </section>

          <section className="admin-stat-grid">
            <StatCard label="MRR" value={currencyFormatter.format(stats.mrr)} accent="#9b8fd4" />
            <StatCard label="Pro users" value={stats.proUsers} accent="#7aaa72" />
            <StatCard label="Cancellations" value={stats.cancellations} accent="#d4848c" />
            <StatCard label="Failed payments" value={stats.failedPayments} accent="#c8a055" />
          </section>

          <section className="admin-chart-grid">
            <AdminChart title="User growth" subtitle="New signups over the last 30 days" height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid stroke="#f4efe6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Line type="monotone" dataKey="users" stroke={ADMIN_CHART_COLORS.primary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </AdminChart>

            <AdminChart title="Lesson completions" subtitle="Completed lessons by track" height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackData}>
                  <CartesianGrid stroke="#f4efe6" vertical={false} />
                  <XAxis dataKey="track" tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="completions" fill={ADMIN_CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChart>
          </section>

          <section className="admin-section-stack">
            <div>
              <h2 className="admin-section-title">Last 10 signups</h2>
              <DataTable columns={recentColumns} data={recentSignups} emptyMessage="No signups yet" />
            </div>

            <div className="admin-status-strip">
              <span>Supabase: <StatusBadge status={systemStatus.supabase} /></span>
              <span>Stripe webhooks: <StatusBadge status={systemStatus.stripe} /> {systemStatus.stripeLabel}</span>
              <span>Netlify: <StatusBadge status={systemStatus.netlify} /> Deployed app available</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function AdminOverviewSkeleton() {
  return (
    <div className="admin-overview-skeleton">
      <div className="admin-stat-grid">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="admin-skeleton-card" />)}
      </div>
      <div className="admin-chart-grid">
        <Skeleton className="admin-skeleton-chart" />
        <Skeleton className="admin-skeleton-chart" />
      </div>
    </div>
  );
}

function buildGrowthData(rows) {
  const countsByDay = new Map();
  rows.forEach((row) => {
    const key = dayKey(row.created_at);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  });

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    date.setHours(0, 0, 0, 0);
    const key = dayKey(date);
    return {
      date: shortDate(date),
      users: countsByDay.get(key) || 0
    };
  });
}

function buildTrackCompletionData(rows) {
  const lessonTrackBySlug = new Map(learnLessons.map((lesson) => [lesson.slug, lesson.track]));
  const completionsByTrack = new Map(learnTracks.map((track) => [track.track, 0]));

  rows.forEach((row) => {
    const track = lessonTrackBySlug.get(row.lesson_slug);
    if (!track) return;
    completionsByTrack.set(track, (completionsByTrack.get(track) || 0) + 1);
  });

  return learnTracks.map((track) => ({
    track: track.title,
    completions: completionsByTrack.get(track.track) || 0
  }));
}
