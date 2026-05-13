import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import AdminChart, { ADMIN_CHART_COLORS } from "../../components/admin/AdminChart";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const DEVICE_COLORS = {
  desktop: "#9b8fd4",
  mobile: "#7aaa72",
  tablet: "#6aa8d4",
  unknown: "#9c918c"
};

export default function AdminTraffic() {
  useDocumentTitle("Traffic admin · ForAllCode");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [views, setViews] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadTraffic() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [viewsResult, countriesResult] = await Promise.all([
          supabase
            .from("usage_events")
            .select("user_id, metadata, created_at")
            .eq("event_type", "page_view")
            .gte("created_at", daysAgoIso(29))
            .limit(10000),
          supabase
            .from("profiles")
            .select("country_code")
            .not("country_code", "is", null)
            .limit(10000)
        ]);

        if (viewsResult.error) throw viewsResult.error;
        if (countriesResult.error) throw countriesResult.error;
        if (!alive) return;
        setViews(viewsResult.data || []);
        setCountries(countriesResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load traffic data.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadTraffic();
    return () => {
      alive = false;
    };
  }, []);

  const routeData = useMemo(() => topGrouped(views, (row) => normalizePath(row.metadata?.path), "route", "views", 10), [views]);
  const dailyData = useMemo(() => buildDailyData(views), [views]);
  const referrerData = useMemo(() => topGrouped(views, (row) => normalizeReferrer(row.metadata?.referrer), "referrer", "views", 8), [views]);
  const deviceData = useMemo(() => topGrouped(views, (row) => detectDevice(row.metadata?.user_agent), "device", "views", 4), [views]);
  const countryData = useMemo(() => topGrouped(countries, (row) => row.country_code || "Unknown", "country", "users", 10), [countries]);
  const repoPageData = useMemo(() => topGrouped(
    views.filter((row) => isRepoRoute(row.metadata?.path)),
    (row) => row.metadata?.path,
    "route",
    "views",
    10
  ), [views]);

  const uniqueUsers = new Set(views.map((row) => row.user_id).filter(Boolean)).size;
  const directViews = referrerData.find((row) => row.referrer === "Direct")?.views || 0;

  const countryColumns = useMemo(() => ([
    { key: "country", label: "Country" },
    { key: "users", label: "Users", width: "120px" }
  ]), []);

  const repoColumns = useMemo(() => ([
    { key: "route", label: "Repo route" },
    { key: "views", label: "Views", width: "120px" }
  ]), []);

  return (
    <div className="admin-traffic-page">
      <AdminPageHeader title="Traffic" subtitle="Privacy-friendly page views from ForAllCode usage events." />
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
            <StatCard label="Page views" value={views.length} accent="#9b8fd4" />
            <StatCard label="Unique users" value={uniqueUsers} accent="#7aaa72" />
            <StatCard label="Top route" value={routeData[0]?.route || "None"} accent="#6aa8d4" />
            <StatCard label="Direct views" value={directViews} accent="#c8a055" />
          </section>

          <section className="admin-chart-grid">
            <AdminChart title="Page views by route" subtitle="Top routes in the last 30 days" height={310}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#f4efe6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis type="category" dataKey="route" width={120} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="views" fill={ADMIN_CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChart>

            <AdminChart title="Traffic over time" subtitle="Daily views and unique users" height={310}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid stroke="#f4efe6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Line type="monotone" dataKey="views" stroke="#9b8fd4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="users" stroke="#7aaa72" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </AdminChart>
          </section>

          <section className="admin-chart-grid">
            <AdminChart title="Referrer breakdown" subtitle="Where visits came from" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referrerData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#f4efe6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <YAxis type="category" dataKey="referrer" width={120} tick={{ fontSize: 10, fill: "#9c918c" }} />
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Bar dataKey="views" fill={ADMIN_CHART_COLORS.info} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AdminChart>

            <AdminChart title="Device breakdown" subtitle="Desktop, mobile, and tablet" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} dataKey="views" nameKey="device" innerRadius={56} outerRadius={90} paddingAngle={3}>
                    {deviceData.map((entry) => <Cell key={entry.device} fill={DEVICE_COLORS[entry.device] || DEVICE_COLORS.unknown} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </AdminChart>
          </section>

          <section className="admin-course-grid">
            <div>
              <h2 className="admin-section-title">Top countries</h2>
              <DataTable columns={countryColumns} data={countryData} emptyMessage="No country data yet" />
            </div>
            <div>
              <h2 className="admin-section-title">Top public repo pages</h2>
              <DataTable columns={repoColumns} data={repoPageData} emptyMessage="No repo page views yet" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function topGrouped(rows, getKey, labelKey, valueKey, limit) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = getKey(row) || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([key, count]) => ({ [labelKey]: key, [valueKey]: count }))
    .sort((a, b) => b[valueKey] - a[valueKey])
    .slice(0, limit);
}

function buildDailyData(rows) {
  const byDay = new Map();
  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const current = byDay.get(key) || { views: 0, users: new Set() };
    current.views += 1;
    if (row.user_id) current.users.add(row.user_id);
    byDay.set(key, current);
  });

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    const item = byDay.get(key);
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      views: item?.views || 0,
      users: item?.users.size || 0
    };
  });
}

function normalizePath(path = "") {
  if (!path) return "Unknown";
  if (/^\/[^/]+\/[^/]+(\/)?$/.test(path)) return "/[username]/[repo]";
  if (/^\/[^/]+\/[^/]+\/issues/.test(path)) return "/[username]/[repo]/issues";
  if (/^\/[^/]+\/[^/]+\/pulls/.test(path)) return "/[username]/[repo]/pulls";
  return path;
}

function normalizeReferrer(referrer = "") {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}

function detectDevice(userAgent = "") {
  const text = userAgent.toLowerCase();
  if (/ipad|tablet/.test(text)) return "tablet";
  if (/mobile|iphone|android/.test(text)) return "mobile";
  if (text) return "desktop";
  return "unknown";
}

function isRepoRoute(path = "") {
  return /^\/[^/]+\/[^/]+\/?$/.test(path)
    && !["/admin", "/settings", "/upgrade"].some((prefix) => path.startsWith(prefix));
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
