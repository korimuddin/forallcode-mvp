import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { useAuthSession, useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GITHUB_CLIENT_ID",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "VITE_STRIPE_PRICE_MONTHLY",
  "VITE_STRIPE_PRICE_ANNUAL"
];

export default function AdminSystem() {
  useDocumentTitle("System health admin · ForAllCode");
  const { session } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [supabaseHealth, setSupabaseHealth] = useState({ status: "degraded", responseMs: null });
  const [stripeHealth, setStripeHealth] = useState({ status: "degraded", label: "No webhook timestamp" });
  const [githubHealth, setGithubHealth] = useState({ status: "degraded", label: "No GitHub token" });
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadSystem() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const start = performance.now();
        const supabaseProbe = await supabase.from("profiles").select("id").limit(1);
        const responseMs = Math.round(performance.now() - start);
        if (supabaseProbe.error) throw supabaseProbe.error;

        const [statusResult, errorsResult, githubResult] = await Promise.all([
          supabase.from("system_status").select("key, value, updated_at").in("key", ["last_stripe_webhook", "stripe_webhook_last_received_at"]),
          supabase
            .from("error_log")
            .select("id, user_id, error_message, error_stack, page_path, created_at, profile:profiles(username)")
            .order("created_at", { ascending: false })
            .limit(20),
          fetchGitHubRateLimit(session?.provider_token)
        ]);

        if (statusResult.error) throw statusResult.error;
        if (errorsResult.error) throw errorsResult.error;
        if (!alive) return;

        const webhook = (statusResult.data || [])[0];
        setSupabaseHealth({
          status: responseMs < 200 ? "online" : responseMs < 500 ? "degraded" : "offline",
          responseMs
        });
        setStripeHealth(stripeStatus(webhook));
        setGithubHealth(githubResult);
        setErrors(errorsResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load system health.");
        setSupabaseHealth({ status: "offline", responseMs: null });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSystem();
    return () => {
      alive = false;
    };
  }, [session?.provider_token]);

  const envRows = useMemo(() => ENV_KEYS.map((key) => ({
    key,
    present: Boolean(import.meta.env[key])
  })), []);

  const errorColumns = useMemo(() => ([
    {
      key: "created_at",
      label: "Time",
      width: "150px",
      render: (value) => formatDistanceToNow(new Date(value), { addSuffix: true })
    },
    {
      key: "profile",
      label: "User",
      width: "130px",
      render: (value, row) => value?.username ? `@${value.username}` : row.user_id ? "Unknown" : "Guest"
    },
    { key: "page_path", label: "Page", width: "180px" },
    { key: "error_message", label: "Message" }
  ]), []);

  return (
    <div className="admin-system-page">
      <AdminPageHeader title="System health" subtitle="Service checks, environment readiness, and captured frontend errors." />
      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <Skeleton className="admin-skeleton-chart" />
      ) : (
        <>
          <section className="admin-stat-grid">
            <SystemCard label="Supabase" status={supabaseHealth.status} detail={supabaseHealth.responseMs ? `${supabaseHealth.responseMs}ms response` : "Query failed"} />
            <SystemCard label="Stripe webhooks" status={stripeHealth.status} detail={stripeHealth.label} />
            <SystemCard label="GitHub API" status={githubHealth.status} detail={githubHealth.label} />
            <SystemCard label="Netlify" status="online" detail="Deployed app available" />
          </section>

          <section className="admin-system-grid">
            <section className="admin-panel">
              <h2>Environment variables</h2>
              <div className="admin-env-list">
                {envRows.map((item) => (
                  <div key={item.key}>
                    <span className="admin-mono-value">{item.key}</span>
                    <StatusBadge status={item.present ? "online" : "offline"} />
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel">
              <h2>Operational notes</h2>
              <p className="admin-panel-muted">Server-only variables such as Stripe secret, service role, and Supabase Management API token are checked through their functions, not exposed to the browser.</p>
              <p className="admin-panel-muted">Netlify deploy metadata can be added later with a Netlify API token if deeper deploy history is needed.</p>
            </section>
          </section>

          <section>
            <h2 className="admin-section-title">Recent error log</h2>
            <DataTable columns={errorColumns} data={errors} emptyMessage="No frontend errors logged" />
          </section>
        </>
      )}
    </div>
  );
}

function SystemCard({ label, status, detail }) {
  const accent = status === "online" ? "#7aaa72" : status === "degraded" ? "#c8a055" : "#d4848c";
  return (
    <div className="admin-system-card" style={{ "--admin-stat-accent": accent }}>
      <div>
        <span>{label}</span>
        <StatusBadge status={status} />
      </div>
      <p>{detail}</p>
    </div>
  );
}

function stripeStatus(webhook) {
  if (!webhook?.value) return { status: "degraded", label: "No webhook received yet" };
  const date = new Date(webhook.value);
  const ageMs = Date.now() - date.getTime();
  const hour = 60 * 60 * 1000;
  if (ageMs > 24 * hour) return { status: "offline", label: `Last webhook ${formatDistanceToNow(date, { addSuffix: true })}` };
  if (ageMs > hour) return { status: "degraded", label: `Last webhook ${formatDistanceToNow(date, { addSuffix: true })}` };
  return { status: "online", label: `Last webhook ${formatDistanceToNow(date, { addSuffix: true })}` };
}

async function fetchGitHubRateLimit(token) {
  if (!token) return { status: "degraded", label: "No GitHub provider token in session" };
  try {
    const response = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (!response.ok) throw new Error("GitHub rate limit check failed.");
    const data = await response.json();
    const core = data.resources?.core;
    if (!core) return { status: "degraded", label: "Rate limit unavailable" };
    const ratio = core.remaining / core.limit;
    return {
      status: ratio > 0.2 ? "online" : ratio > 0.05 ? "degraded" : "offline",
      label: `${core.remaining} / ${core.limit} requests remaining`
    };
  } catch (error) {
    return { status: "offline", label: error.message || "GitHub check failed" };
  }
}
