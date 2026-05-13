import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Link } from "react-router-dom";
import AdminChart, { ADMIN_CHART_COLORS } from "../../components/admin/AdminChart";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const MONTHLY_PRICE = 10;
const STATUS_COLORS = {
  active: "#7aaa72",
  cancelled: "#d4848c",
  past_due: "#c8a055",
  trialing: "#9b8fd4",
  free: "#9c918c"
};

export default function AdminSubscriptions() {
  useDocumentTitle("Subscriptions admin · ForAllCode");
  const [subscriptions, setSubscriptions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stripeEvents, setStripeEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadSubscriptions() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [subsResult, feedbackResult, notificationsResult] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("*, profile:profiles(username, display_name, github_username)")
            .order("created_at", { ascending: false }),
          supabase
            .from("upgrade_feedback")
            .select("response, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("notifications")
            .select("id, type, message, created_at, profile:profiles(username)")
            .in("type", ["checkout.session.completed", "invoice.payment_failed", "customer.subscription.updated", "customer.subscription.deleted", "system"])
            .order("created_at", { ascending: false })
            .limit(12)
        ]);

        const queryError = subsResult.error || feedbackResult.error || notificationsResult.error;
        if (queryError) throw queryError;
        if (!alive) return;
        setSubscriptions(subsResult.data || []);
        setFeedback(feedbackResult.data || []);
        setStripeEvents(notificationsResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load subscription data.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSubscriptions();
    return () => {
      alive = false;
    };
  }, []);

  const proActive = subscriptions.filter((sub) => sub.plan_id === "pro" && sub.status === "active");
  const cancelled = subscriptions.filter((sub) => sub.status === "cancelled" || sub.cancel_at_period_end);
  const pastDue = subscriptions.filter((sub) => sub.status === "past_due");
  const mrr = proActive.length * MONTHLY_PRICE;
  const churnRate = subscriptions.length ? Math.round((cancelled.length / subscriptions.length) * 100) : 0;
  const mrrGrowth = useMemo(() => buildMrrGrowth(subscriptions), [subscriptions]);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(subscriptions), [subscriptions]);
  const keywords = useMemo(() => topKeywords(feedback), [feedback]);

  const activeColumns = useMemo(() => ([
    {
      key: "profile",
      label: "User",
      render: (_value, row) => (
        <div>
          <strong className="admin-table-primary">{row.profile?.display_name || row.profile?.username || "Unknown user"}</strong>
          <span className="admin-table-secondary">@{row.profile?.username || "unknown"}</span>
        </div>
      )
    },
    {
      key: "created_at",
      label: "Started",
      width: "130px",
      render: (value) => formatDate(value)
    },
    {
      key: "current_period_end",
      label: "Renewal",
      width: "130px",
      render: (value) => formatDate(value)
    },
    {
      key: "stripe_customer_id",
      label: "Stripe ID",
      width: "180px",
      render: (value, row) => (
        <span className="admin-mono-value">{truncate(value || row.stripe_subscription_id || "Not linked")}</span>
      )
    },
    {
      key: "id",
      label: "Actions",
      width: "210px",
      render: (_value, row) => (
        <div className="admin-inline-actions">
          {row.stripe_customer_id && (
            <a href={`https://dashboard.stripe.com/customers/${row.stripe_customer_id}`} rel="noreferrer" target="_blank">Open Stripe</a>
          )}
          <button disabled={busyId === row.id} onClick={() => cancelSubscription(row)} type="button">Cancel</button>
        </div>
      )
    }
  ]), [busyId]);

  const failedColumns = useMemo(() => ([
    {
      key: "profile",
      label: "User",
      render: (_value, row) => row.profile?.username || "Unknown user"
    },
    {
      key: "stripe_customer_id",
      label: "Stripe customer",
      render: (value) => <span className="admin-mono-value">{truncate(value || "Not linked")}</span>
    },
    {
      key: "updated_at",
      label: "Updated",
      render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "Unknown"
    }
  ]), []);

  async function cancelSubscription(row) {
    if (!window.confirm(`Cancel Pro access for @${row.profile?.username || row.user_id}?`)) return;
    setBusyId(row.id);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan_id: "free",
          status: "cancelled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id);
      if (updateError) throw updateError;
      setSubscriptions((current) => current.map((sub) => (
        sub.id === row.id ? { ...sub, plan_id: "free", status: "cancelled", cancel_at_period_end: true } : sub
      )));
    } catch (cancelError) {
      setError(cancelError.message || "Could not cancel the subscription.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="admin-subscriptions-page">
      <AdminPageHeader title="Subscriptions" subtitle="Stripe subscription health, revenue, and upgrade intent." />
      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <div className="admin-overview-skeleton">
          <div className="admin-stat-grid">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="admin-skeleton-card" />)}
          </div>
          <Skeleton className="admin-skeleton-chart" />
        </div>
      ) : (
        <>
          <section className="admin-stat-grid">
            <StatCard label="MRR" value={`£${mrr}`} accent="#7aaa72" />
            <StatCard label="ARR" value={`£${mrr * 12}`} accent="#7aaa72" />
            <StatCard label="Pro subscribers" value={proActive.length} accent="#9b8fd4" />
            <StatCard label="Churn rate" value={`${churnRate}%`} accent="#d4848c" />
          </section>

          <section className="admin-chart-grid">
            <AdminChart title="MRR growth" subtitle="Cumulative MRR from Pro subscriptions" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrGrowth}>
                  <CartesianGrid stroke="#f4efe6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Line type="monotone" dataKey="mrr" stroke="#7aaa72" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </AdminChart>

            <AdminChart title="Subscription status" subtitle="Current billing statuses" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" innerRadius={56} outerRadius={90} paddingAngle={3}>
                    {statusBreakdown.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || STATUS_COLORS.free} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </AdminChart>
          </section>

          {pastDue.length > 0 && (
            <section className="admin-billing-alert">
              <strong>{pastDue.length} subscription{pastDue.length === 1 ? "" : "s"} have failed payments.</strong>
              <p>Follow up in Stripe and check whether webhook updates are arriving.</p>
            </section>
          )}

          <section>
            <h2 className="admin-section-title">Active subscriptions</h2>
            <DataTable columns={activeColumns} data={proActive} emptyMessage="No active Pro subscriptions yet" />
          </section>

          <section className="admin-course-grid">
            <div>
              <h2 className="admin-section-title">Failed payments</h2>
              <DataTable columns={failedColumns} data={pastDue} emptyMessage="No failed payments" />
            </div>
            <section className="admin-panel">
              <h2>Upgrade feedback summary</h2>
              <p className="admin-panel-muted">{feedback.length} total response{feedback.length === 1 ? "" : "s"} collected.</p>
              <div className="admin-keyword-list">
                {keywords.length === 0 ? <span>No keywords yet</span> : keywords.map((item) => (
                  <span key={item.word}>{item.word} · {item.count}</span>
                ))}
              </div>
              <Link className="admin-panel-link" to="/admin/content">View all feedback</Link>
            </section>
          </section>

          <section className="admin-panel">
            <h2>Recent Stripe events</h2>
            {stripeEvents.length === 0 ? (
              <p className="admin-panel-muted">No Stripe event notifications have been logged yet.</p>
            ) : (
              <div className="admin-activity-list">
                {stripeEvents.map((event) => (
                  <article key={event.id}>
                    <StatusBadge status={event.type?.includes("failed") ? "past_due" : "active"} />
                    <div>
                      <p>{event.message || event.type}</p>
                      <time>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</time>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function buildMrrGrowth(subscriptions) {
  const proByDay = new Map();
  subscriptions
    .filter((sub) => sub.plan_id === "pro")
    .forEach((sub) => {
      const key = new Date(sub.created_at).toISOString().slice(0, 10);
      proByDay.set(key, (proByDay.get(key) || 0) + 1);
    });

  let running = 0;
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    running += (proByDay.get(key) || 0) * MONTHLY_PRICE;
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      mrr: running
    };
  });
}

function buildStatusBreakdown(subscriptions) {
  const counts = new Map();
  subscriptions.forEach((sub) => {
    const status = sub.status || "active";
    counts.set(status, (counts.get(status) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

function topKeywords(feedback) {
  const stopWords = new Set(["the", "and", "for", "with", "that", "this", "would", "make", "from", "have", "private", "repos"]);
  const counts = new Map();
  feedback.forEach((item) => {
    String(item.response || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function truncate(value) {
  if (!value || value.length < 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}
