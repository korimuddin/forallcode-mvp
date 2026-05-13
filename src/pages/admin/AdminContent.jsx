import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "../../components/admin/AdminLayout";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import DataTable from "../../components/admin/DataTable";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import { learnLessons, learnTracks } from "../../data/learnLessons";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

export default function AdminContent() {
  useDocumentTitle("Content admin · ForAllCode");
  const [activeTab, setActiveTab] = useState("lessons");
  const [lessons, setLessons] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadContent() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [progressResult, lessonSettingsResult, feedbackResult] = await Promise.all([
          supabase.from("learn_progress").select("lesson_slug").eq("completed", true).limit(10000),
          supabase.from("lessons").select("slug, title, track, tag, is_published, is_featured"),
          supabase
            .from("upgrade_feedback")
            .select("id, user_id, response, created_at, profile:profiles(username, display_name)")
            .order("created_at", { ascending: false })
        ]);

        if (progressResult.error) throw progressResult.error;
        if (feedbackResult.error) throw feedbackResult.error;
        if (lessonSettingsResult.error && lessonSettingsResult.error.code !== "PGRST205") {
          throw lessonSettingsResult.error;
        }

        if (!alive) return;
        const completions = countByKey(progressResult.data || [], "lesson_slug");
        const settingsBySlug = new Map((lessonSettingsResult.data || []).map((item) => [item.slug, item]));
        setLessons(learnLessons.map((lesson) => {
          const setting = settingsBySlug.get(lesson.slug);
          return {
            slug: lesson.slug,
            title: setting?.title || lesson.title,
            track: lesson.track,
            trackLabel: learnTracks.find((track) => track.track === lesson.track)?.title || `Track ${lesson.track}`,
            tag: lesson.tag,
            completions: completions.get(lesson.slug) || 0,
            is_published: setting?.is_published ?? true,
            is_featured: setting?.is_featured ?? false
          };
        }));
        setFeedback(feedbackResult.data || []);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load content data.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadContent();
    return () => {
      alive = false;
    };
  }, []);

  const filteredFeedback = useMemo(() => feedback.filter((item) => {
    const response = item.response || "";
    const profileText = `${item.profile?.username || ""} ${item.profile?.display_name || ""}`;
    const matchesSearch = !feedbackSearch.trim()
      || `${response} ${profileText}`.toLowerCase().includes(feedbackSearch.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (dateRange === "all") return true;
    const created = new Date(item.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(dateRange));
    return created >= cutoff;
  }), [dateRange, feedback, feedbackSearch]);

  const lessonColumns = useMemo(() => ([
    {
      key: "title",
      label: "Lesson",
      render: (value, row) => (
        <div>
          <strong className="admin-table-primary">{value}</strong>
          <span className="admin-table-secondary">{row.slug}</span>
        </div>
      )
    },
    { key: "trackLabel", label: "Track", width: "130px" },
    {
      key: "tag",
      label: "Tag",
      width: "120px",
      render: (value) => <span className={value === "devops" ? "admin-devops-pill" : "admin-tag-pill"}>{value}</span>
    },
    { key: "completions", label: "Completions", width: "120px" },
    {
      key: "is_published",
      label: "Status",
      width: "100px",
      render: (value) => <StatusBadge status={value ? "online" : "offline"} />
    },
    {
      key: "slug",
      label: "Actions",
      width: "260px",
      render: (_value, row) => (
        <div className="admin-inline-actions">
          <button disabled={savingSlug === row.slug} onClick={() => toggleLesson(row, "is_published")} type="button">
            {row.is_published ? "Hide" : "Make live"}
          </button>
          <button disabled={savingSlug === row.slug} onClick={() => toggleLesson(row, "is_featured")} type="button">
            {row.is_featured ? "Unfeature" : "Feature"}
          </button>
          <button onClick={() => window.alert(`${row.title}: ${row.completions} completions`)} type="button">
            Stats
          </button>
        </div>
      )
    }
  ]), [savingSlug]);

  async function toggleLesson(row, key) {
    setSavingSlug(row.slug);
    setError("");
    const nextValue = !row[key];

    try {
      const { error: saveError } = await supabase.from("lessons").upsert({
        slug: row.slug,
        title: row.title,
        track: row.track,
        tag: row.tag,
        is_published: key === "is_published" ? nextValue : row.is_published,
        is_featured: key === "is_featured" ? nextValue : row.is_featured,
        updated_at: new Date().toISOString()
      }, { onConflict: "slug" });
      if (saveError) throw saveError;
      setLessons((current) => current.map((lesson) => (
        lesson.slug === row.slug ? { ...lesson, [key]: nextValue } : lesson
      )));
    } catch (saveError) {
      setError(saveError.message || "Could not update lesson metadata.");
    } finally {
      setSavingSlug("");
    }
  }

  function exportFeedbackCSV() {
    const headers = ["username", "display_name", "response", "created_at"];
    const rows = filteredFeedback.map((item) => [
      item.profile?.username || "",
      item.profile?.display_name || "",
      item.response || "",
      item.created_at || ""
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forallcode-upgrade-feedback.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-content-page">
      <AdminPageHeader
        title="Content"
        subtitle="Manage lesson visibility and review upgrade feedback."
        action={activeTab === "feedback" ? <button className="admin-secondary-button" onClick={exportFeedbackCSV} type="button">Export CSV</button> : null}
      />

      <div className="admin-tabs">
        <button className={activeTab === "lessons" ? "active" : ""} onClick={() => setActiveTab("lessons")} type="button">Lessons</button>
        <button className={activeTab === "feedback" ? "active" : ""} onClick={() => setActiveTab("feedback")} type="button">Feedback</button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <Skeleton className="admin-users-table-skeleton" />
      ) : activeTab === "lessons" ? (
        <section className="admin-section-stack">
          <div className="admin-stat-grid compact">
            <StatCard label="Total lessons" value={lessons.length} accent="#9b8fd4" />
            <StatCard label="Live" value={lessons.filter((lesson) => lesson.is_published).length} accent="#7aaa72" />
            <StatCard label="Hidden" value={lessons.filter((lesson) => !lesson.is_published).length} accent="#d4848c" />
            <StatCard label="Featured" value={lessons.filter((lesson) => lesson.is_featured).length} accent="#c8a055" />
          </div>
          <DataTable columns={lessonColumns} data={lessons} emptyMessage="No lessons found" />
        </section>
      ) : (
        <section className="admin-section-stack">
          <div className="admin-filter-row">
            <AdminSearchBar value={feedbackSearch} onChange={setFeedbackSearch} placeholder="Search feedback" />
            <select className="admin-select" value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option value="all">All dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <span className="admin-feedback-count">{filteredFeedback.length} response{filteredFeedback.length === 1 ? "" : "s"}</span>
          </div>
          <div className="admin-feedback-card-list">
            {filteredFeedback.length === 0 ? (
              <p className="empty-helper">No feedback matches these filters.</p>
            ) : filteredFeedback.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>@{item.profile?.username || "unknown"}</strong>
                  <time>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</time>
                </div>
                <p>{item.response}</p>
              </article>
            ))}
          </div>
        </section>
      )}
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
