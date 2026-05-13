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
  const [spotlights, setSpotlights] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [spotlightForm, setSpotlightForm] = useState(() => getEmptySpotlightForm());
  const [spotlightDeveloperSearch, setSpotlightDeveloperSearch] = useState("");
  const [editingSpotlightId, setEditingSpotlightId] = useState("");
  const [savingSpotlight, setSavingSpotlight] = useState(false);
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
        const [progressResult, lessonSettingsResult, feedbackResult, spotlightResult, profilesResult, reposResult] = await Promise.all([
          supabase.from("learn_progress").select("lesson_slug").eq("completed", true).limit(10000),
          supabase.from("lessons").select("slug, title, track, tag, is_published, is_featured"),
          supabase
            .from("upgrade_feedback")
            .select("id, user_id, response, created_at, profile:profiles(username, display_name)")
            .order("created_at", { ascending: false }),
          supabase.from("spotlight_entries").select("*").order("week_of", { ascending: false }),
          supabase.from("profiles").select("id, username, display_name, avatar_style, avatar_url").order("username", { ascending: true }).limit(500),
          supabase.from("repositories").select("id, owner_id, name").order("name", { ascending: true }).limit(1000)
        ]);

        if (progressResult.error) throw progressResult.error;
        if (feedbackResult.error) throw feedbackResult.error;
        if (spotlightResult.error) throw spotlightResult.error;
        if (profilesResult.error) throw profilesResult.error;
        if (reposResult.error) throw reposResult.error;
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
        setProfiles(profilesResult.data || []);
        setRepositories(reposResult.data || []);
        setSpotlights(hydrateSpotlights(spotlightResult.data || [], profilesResult.data || [], reposResult.data || []));
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

  const selectedDeveloperRepos = useMemo(() => (
    repositories.filter((repo) => repo.owner_id === spotlightForm.user_id)
  ), [repositories, spotlightForm.user_id]);

  const filteredSpotlightProfiles = useMemo(() => {
    const term = spotlightDeveloperSearch.trim().toLowerCase();
    const selected = profiles.find((profile) => profile.id === spotlightForm.user_id);
    const filtered = term
      ? profiles.filter((profile) => `${profile.username || ""} ${profile.display_name || ""}`.toLowerCase().includes(term))
      : profiles;
    if (selected && !filtered.some((profile) => profile.id === selected.id)) return [selected, ...filtered];
    return filtered;
  }, [profiles, spotlightDeveloperSearch, spotlightForm.user_id]);

  const spotlightColumns = useMemo(() => ([
    {
      key: "week_of",
      label: "Week",
      width: "130px",
      render: (value) => formatWeek(value)
    },
    {
      key: "profile",
      label: "Developer",
      render: (_value, row) => (
        <div>
          <strong className="admin-table-primary">{row.profile?.display_name || row.profile?.username || "Unknown"}</strong>
          <span className="admin-table-secondary">@{row.profile?.username || "unknown"}</span>
        </div>
      )
    },
    {
      key: "headline",
      label: "Headline",
      render: (value, row) => (
        <div>
          <strong className="admin-table-primary">{value}</strong>
          <span className="admin-table-secondary">{row.reason}</span>
        </div>
      )
    },
    {
      key: "repository",
      label: "Featured repo",
      width: "160px",
      render: (_value, row) => row.repository?.name || "None"
    },
    {
      key: "id",
      label: "Actions",
      width: "150px",
      render: (_value, row) => (
        <div className="admin-inline-actions">
          <button onClick={() => editSpotlight(row)} type="button">Edit</button>
          <button onClick={() => deleteSpotlight(row.id)} type="button">Delete</button>
        </div>
      )
    }
  ]), []);

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

  function updateSpotlightForm(key, value) {
    setSpotlightForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "user_id" ? { featured_repo_id: "" } : {})
    }));
  }

  function editSpotlight(entry) {
    const profile = profiles.find((item) => item.id === entry.user_id);
    setEditingSpotlightId(entry.id);
    setSpotlightDeveloperSearch(profile?.username || "");
    setSpotlightForm({
      user_id: entry.user_id || "",
      headline: entry.headline || "",
      reason: entry.reason || "",
      featured_repo_id: entry.featured_repo_id || "",
      week_of: entry.week_of || getWeekStartDate()
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetSpotlightForm() {
    setEditingSpotlightId("");
    setSpotlightDeveloperSearch("");
    setSpotlightForm(getEmptySpotlightForm());
  }

  async function saveSpotlight(event) {
    event.preventDefault();
    setError("");

    if (!spotlightForm.user_id || !spotlightForm.headline.trim() || !spotlightForm.reason.trim()) {
      setError("Choose a developer, headline, and reason before saving the spotlight.");
      return;
    }

    setSavingSpotlight(true);
    const payload = {
      user_id: spotlightForm.user_id,
      headline: spotlightForm.headline.trim(),
      reason: spotlightForm.reason.trim(),
      featured_repo_id: spotlightForm.featured_repo_id || null,
      week_of: spotlightForm.week_of || getWeekStartDate()
    };

    try {
      const query = editingSpotlightId
        ? supabase.from("spotlight_entries").update(payload).eq("id", editingSpotlightId)
        : supabase.from("spotlight_entries").upsert(payload, { onConflict: "user_id,week_of" });
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      await refreshSpotlights();
      resetSpotlightForm();
    } catch (saveError) {
      setError(saveError.message || "Could not save spotlight entry.");
    } finally {
      setSavingSpotlight(false);
    }
  }

  async function refreshSpotlights() {
    const { data, error: loadError } = await supabase
      .from("spotlight_entries")
      .select("*")
      .order("week_of", { ascending: false });
    if (loadError) throw loadError;
    setSpotlights(hydrateSpotlights(data || [], profiles, repositories));
  }

  async function deleteSpotlight(id) {
    if (!window.confirm("Delete this spotlight entry?")) return;
    setError("");
    const { error: deleteError } = await supabase.from("spotlight_entries").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message || "Could not delete spotlight entry.");
      return;
    }
    setSpotlights((current) => current.filter((entry) => entry.id !== id));
    if (editingSpotlightId === id) resetSpotlightForm();
  }

  return (
    <div className="admin-content-page">
      <AdminPageHeader
        title="Content"
        subtitle="Manage lesson visibility, spotlights, and upgrade feedback."
        action={activeTab === "feedback" ? <button className="admin-secondary-button" onClick={exportFeedbackCSV} type="button">Export CSV</button> : null}
      />

      <div className="admin-tabs">
        <button className={activeTab === "lessons" ? "active" : ""} onClick={() => setActiveTab("lessons")} type="button">Lessons</button>
        <button className={activeTab === "spotlight" ? "active" : ""} onClick={() => setActiveTab("spotlight")} type="button">Spotlight</button>
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
      ) : activeTab === "spotlight" ? (
        <section className="admin-section-stack">
          <form className="admin-panel admin-spotlight-form" onSubmit={saveSpotlight}>
            <div className="admin-spotlight-form-head">
              <div>
                <h2>{editingSpotlightId ? "Edit spotlight entry" : "Add spotlight entry"}</h2>
                <p className="admin-panel-muted">Curate two or three developers for the weekly Explore spotlight.</p>
              </div>
              <button className="admin-secondary-button" type="button" onClick={resetSpotlightForm}>+ Add spotlight entry</button>
            </div>
            <div className="admin-spotlight-grid">
              <label>
                Developer
                <input value={spotlightDeveloperSearch} onChange={(event) => setSpotlightDeveloperSearch(event.target.value)} placeholder="Search username" />
                <select className="admin-select" value={spotlightForm.user_id} onChange={(event) => updateSpotlightForm("user_id", event.target.value)}>
                  <option value="">Choose developer</option>
                  {filteredSpotlightProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      @{profile.username || "unknown"} {profile.display_name ? `— ${profile.display_name}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Week
                <input value={spotlightForm.week_of} onChange={(event) => updateSpotlightForm("week_of", event.target.value)} type="date" />
              </label>
              <label>
                Headline
                <input value={spotlightForm.headline} onChange={(event) => updateSpotlightForm("headline", event.target.value)} placeholder="Built something worth sharing" />
              </label>
              <label>
                Featured repo
                <select className="admin-select" value={spotlightForm.featured_repo_id} onChange={(event) => updateSpotlightForm("featured_repo_id", event.target.value)}>
                  <option value="">No featured repo</option>
                  {selectedDeveloperRepos.map((repo) => (
                    <option key={repo.id} value={repo.id}>{repo.name}</option>
                  ))}
                </select>
              </label>
              <label className="admin-spotlight-wide">
                Reason
                <textarea value={spotlightForm.reason} onChange={(event) => updateSpotlightForm("reason", event.target.value)} placeholder="Explain why this developer is being featured." rows={4} />
              </label>
            </div>
            <div className="admin-spotlight-actions">
              <button className="admin-secondary-button" disabled={savingSpotlight} type="submit">
                {savingSpotlight ? "Saving..." : "Save spotlight"}
              </button>
              {editingSpotlightId && <button className="admin-inline-reset" type="button" onClick={resetSpotlightForm}>Cancel edit</button>}
            </div>
          </form>

          <div className="admin-section-stack">
            <div className="explore-section-heading">
              <p className="eyebrow">Past spotlights</p>
              <span>{spotlights.length} entr{spotlights.length === 1 ? "y" : "ies"}</span>
            </div>
            <DataTable columns={spotlightColumns} data={spotlights} emptyMessage="No spotlight entries yet" />
          </div>
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

function hydrateSpotlights(entries, profiles, repositories) {
  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const reposById = new Map((repositories || []).map((repo) => [repo.id, repo]));
  return entries.map((entry) => ({
    ...entry,
    profile: profilesById.get(entry.user_id),
    repository: reposById.get(entry.featured_repo_id)
  }));
}

function getEmptySpotlightForm() {
  return {
    user_id: "",
    headline: "",
    reason: "",
    featured_repo_id: "",
    week_of: getWeekStartDate()
  };
}

function getWeekStartDate(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  return next.toISOString().slice(0, 10);
}

function formatWeek(value) {
  if (!value) return "Unscheduled";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
