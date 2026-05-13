import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const emptyColumns = [
  { key: "course", label: "Course" },
  { key: "author", label: "Author" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status", render: (value) => <StatusBadge status={value || "degraded"} /> },
  { key: "actions", label: "Actions" }
];

export default function AdminMarketplace() {
  useDocumentTitle("Marketplace admin · ForAllCode");
  const [settings, setSettings] = useState({
    is_live: false,
    author_revenue_pct: 70,
    min_price_gbp: 5,
    max_price_gbp: 99
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [revenueRows, setRevenueRows] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadSettings() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [{ data, error: settingsError }, { data: courseData }, { data: purchases }, { data: reviewData }] = await Promise.all([
          supabase.from("marketplace_settings").select("*").eq("id", 1).maybeSingle(),
          supabase.from("marketplace_courses").select("*, profiles(username, display_name)").order("created_at", { ascending: false }),
          supabase.from("course_purchases").select("amount_gbp, author_payout_gbp, platform_fee_gbp"),
          supabase.from("course_reviews").select("rating")
        ]);
        if (settingsError) throw settingsError;
        if (!alive) return;
        if (data) {
          setSettings({
            is_live: data.is_live,
            author_revenue_pct: data.author_revenue_pct ?? 70,
            min_price_gbp: Number(data.min_price_gbp ?? 5),
            max_price_gbp: Number(data.max_price_gbp ?? 99)
          });
        }
        setCourses(courseData || []);
        setRevenueRows(purchases || []);
        setReviews(reviewData || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load marketplace settings.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      alive = false;
    };
  }, []);

  const platformRevenuePct = Math.max(0, 100 - Number(settings.author_revenue_pct || 0));
  const readinessIssues = getReadinessIssues(settings);
  const pendingCourses = courses.filter((course) => course.status === "pending_review");
  const approvedCourses = courses.filter((course) => course.status === "approved");
  const totalRevenue = revenueRows.reduce((sum, row) => sum + Number(row.amount_gbp || 0), 0);
  const averageRating = reviews.length
    ? reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length
    : 0;
  const courseRows = useMemo(() => pendingCourses.map((course) => ({
    course: (
      <div>
        <strong>{course.title}</strong>
        <small>{course.description || "No description"}</small>
      </div>
    ),
    author: course.profiles?.display_name || course.profiles?.username || "Unknown",
    submitted: new Date(course.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: course.status,
    actions: (
      <div className="admin-inline-actions">
        <button onClick={() => updateCourseStatus(course.id, "approved")} type="button">Approve</button>
        <button onClick={() => updateCourseStatus(course.id, "changes_requested")} type="button">Request changes</button>
      </div>
    )
  })), [pendingCourses]);

  async function saveSettings() {
    setSaveState("saving");
    setError("");

    try {
      const { error: saveError } = await supabase
        .from("marketplace_settings")
        .upsert({
          id: 1,
          is_live: settings.is_live,
          author_revenue_pct: Number(settings.author_revenue_pct),
          min_price_gbp: Number(settings.min_price_gbp),
          max_price_gbp: Number(settings.max_price_gbp),
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      if (saveError) throw saveError;
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch (saveError) {
      setError(saveError.message || "Could not save marketplace settings.");
      setSaveState("idle");
    }
  }

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    if (saveState === "saved") setSaveState("idle");
  }

  async function updateCourseStatus(courseId, status) {
    setError("");
    const { error: updateError } = await supabase
      .from("marketplace_courses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", courseId);
    if (updateError) {
      setError(updateError.message || "Could not update course status.");
      return;
    }
    setCourses((current) => current.map((course) => course.id === courseId ? { ...course, status } : course));
  }

  return (
    <div className="admin-marketplace-page">
      <AdminPageHeader title="Marketplace" subtitle="Phase 7 launch controls, review queues, and revenue settings." />
      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <Skeleton className="admin-skeleton-chart" />
      ) : (
        <>
          <section className="admin-stat-grid">
            <StatCard label="Submitted courses" value={pendingCourses.length} delta={0} deltaLabel="pending review" accent="#c8a055" />
            <StatCard label="Approved courses" value={approvedCourses.length} delta={0} deltaLabel="live" accent="#7aaa72" />
            <StatCard label="Total revenue" value={`£${totalRevenue.toFixed(2)}`} delta={0} deltaLabel="all time" accent="#9b8fd4" />
            <StatCard label="Avg rating" value={`${averageRating.toFixed(1)}/5`} accent="#6aa8d4" />
          </section>

          <section className={readinessIssues.length ? "admin-readiness-card warn" : "admin-readiness-card"}>
            <div>
              <h2>Marketplace readiness</h2>
              <StatusBadge status={settings.is_live ? "online" : "degraded"} />
            </div>
            {readinessIssues.length ? (
              <ul>
                {readinessIssues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            ) : (
              <p>Settings are valid. Marketplace can stay {settings.is_live ? "live" : "in coming soon mode"}.</p>
            )}
          </section>

          <section className="admin-marketplace-grid">
            <section className="admin-panel">
              <h2>Marketplace settings</h2>
              <div className="admin-settings-form">
                <label className="admin-toggle-row">
                  <input
                    checked={settings.is_live}
                    onChange={(event) => updateSetting("is_live", event.target.checked)}
                    type="checkbox"
                  />
                  <span>{settings.is_live ? "Marketplace is live" : "Marketplace is coming soon"}</span>
                </label>

                <label>
                  <span>Author revenue split</span>
                  <input
                    max="95"
                    min="1"
                    onChange={(event) => updateSetting("author_revenue_pct", event.target.value)}
                    type="number"
                    value={settings.author_revenue_pct}
                  />
                  <small>{settings.author_revenue_pct}% author / {platformRevenuePct}% ForAllCode</small>
                </label>

                <label>
                  <span>Minimum price (£)</span>
                  <input
                    min="0"
                    onChange={(event) => updateSetting("min_price_gbp", event.target.value)}
                    step="0.5"
                    type="number"
                    value={settings.min_price_gbp}
                  />
                </label>

                <label>
                  <span>Maximum price (£)</span>
                  <input
                    min="0"
                    onChange={(event) => updateSetting("max_price_gbp", event.target.value)}
                    step="0.5"
                    type="number"
                    value={settings.max_price_gbp}
                  />
                </label>

                <button
                  className={saveState === "saved" ? "admin-save-button saved" : "admin-save-button"}
                  disabled={saveState === "saving" || readinessIssues.some((issue) => issue.includes("invalid"))}
                  onClick={saveSettings}
                  type="button"
                >
                  {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save settings"}
                </button>
              </div>
            </section>

            <section className="admin-panel">
              <h2>Revenue split preview</h2>
              <div className="admin-revenue-preview">
                {[5, 10, 25, 49].map((price) => {
                  const author = (price * Number(settings.author_revenue_pct || 0)) / 100;
                  const platform = price - author;
                  return (
                    <div key={price}>
                      <span>£{price.toFixed(2)} sale</span>
                      <strong>£{author.toFixed(2)} author</strong>
                      <small>£{platform.toFixed(2)} ForAllCode</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>

          <section>
            <h2 className="admin-section-title">Course submissions</h2>
            <DataTable columns={emptyColumns} data={courseRows} emptyMessage="No course submissions yet" />
          </section>

          <section>
            <h2 className="admin-section-title">README template submissions</h2>
            <DataTable columns={emptyColumns} data={[]} emptyMessage="No README template submissions yet" />
          </section>
        </>
      )}
    </div>
  );
}

function getReadinessIssues(settings) {
  const issues = [];
  const authorPct = Number(settings.author_revenue_pct);
  const minPrice = Number(settings.min_price_gbp);
  const maxPrice = Number(settings.max_price_gbp);

  if (!Number.isFinite(authorPct) || authorPct <= 0 || authorPct >= 100) {
    issues.push("Revenue split is invalid. Author percentage must be between 1 and 99.");
  }
  if (!Number.isFinite(minPrice) || minPrice < 0) {
    issues.push("Minimum price is invalid.");
  }
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    issues.push("Maximum price is invalid.");
  }
  if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice > maxPrice) {
    issues.push("Minimum price cannot be higher than maximum price.");
  }
  if (settings.is_live && issues.length) {
    issues.push("Marketplace is live while settings need attention.");
  }

  return issues;
}
