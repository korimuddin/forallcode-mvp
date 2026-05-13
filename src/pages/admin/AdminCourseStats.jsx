import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { learnLessons, learnTracks } from "../../data/learnLessons";
import { useDocumentTitle } from "../../lib/hooks";
import { supabase } from "../../lib/supabase";

const TRACK_COLORS = {
  beginner: "#9b8fd4",
  intermediate: "#7aaa72",
  advanced: "#6aa8d4",
  unknown: "#9c918c"
};

export default function AdminCourseStats() {
  useDocumentTitle("Course stats admin · ForAllCode");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comfortData, setComfortData] = useState([]);
  const [lessonCompletionData, setLessonCompletionData] = useState([]);
  const [dropOffData, setDropOffData] = useState([]);
  const [trackStats, setTrackStats] = useState([]);
  const [replayData, setReplayData] = useState([]);
  const [recentCompletions, setRecentCompletions] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadCourseStats() {
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          profilesResult,
          progressResult,
          usageResult,
          recentResult
        ] = await Promise.all([
          supabase.from("profiles").select("learn_comfort_level"),
          supabase.from("learn_progress").select("user_id, lesson_slug, completed, completed_at").limit(8000),
          supabase.from("usage_events").select("user_id, event_type, metadata, created_at").in("event_type", ["lesson_viewed", "lesson_completed"]).limit(8000),
          supabase
            .from("learn_progress")
            .select("lesson_slug, completed_at, profile:profiles(username, display_name)")
            .eq("completed", true)
            .not("completed_at", "is", null)
            .order("completed_at", { ascending: false })
            .limit(20)
        ]);

        const queryError = profilesResult.error || progressResult.error || usageResult.error || recentResult.error;
        if (queryError) throw queryError;
        if (!alive) return;

        const profiles = profilesResult.data || [];
        const progressRows = progressResult.data || [];
        const usageRows = usageResult.data || [];

        setComfortData(buildComfortData(profiles));
        setLessonCompletionData(buildLessonCompletionData(progressRows));
        setDropOffData(buildDropOffData(progressRows, usageRows));
        setTrackStats(buildTrackStats(progressRows));
        setReplayData(buildReplayData(usageRows));
        setRecentCompletions((recentResult.data || []).map((item) => ({
          ...item,
          lessonTitle: lessonTitle(item.lesson_slug)
        })));
      } catch (loadError) {
        if (!alive) return;
        setError(loadError.message || "Could not load course statistics.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadCourseStats();
    return () => {
      alive = false;
    };
  }, []);

  const dropOffColumns = useMemo(() => ([
    { key: "lesson", label: "Lesson" },
    { key: "started", label: "Started", width: "90px" },
    { key: "completed", label: "Completed", width: "110px" },
    {
      key: "dropOff",
      label: "Drop-off",
      width: "100px",
      render: (value) => `${value}%`
    }
  ]), []);

  const replayColumns = useMemo(() => ([
    { key: "lesson", label: "Lesson" },
    { key: "users", label: "Users", width: "90px" },
    { key: "events", label: "Replays", width: "90px" }
  ]), []);

  if (loading) {
    return (
      <div className="admin-course-page">
        <AdminPageHeader title="Course stats" subtitle="Learn centre engagement and completion data." />
        <div className="admin-chart-grid">
          <Skeleton className="admin-skeleton-chart" />
          <Skeleton className="admin-skeleton-chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-course-page">
      <AdminPageHeader title="Course stats" subtitle="Learn centre engagement, progress, and lesson quality signals." />
      {error && <p className="auth-error">{error}</p>}

      <section className="admin-chart-grid">
        <AdminChart title="Comfort level distribution" subtitle="Selected during Learn onboarding" height={270}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={comfortData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {comfortData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </AdminChart>

        <AdminChart title="Lessons by completion count" subtitle="Completed lessons, highest first" height={270}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lessonCompletionData.slice(0, 10)} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="#f4efe6" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9c918c" }} />
              <YAxis type="category" dataKey="lesson" width={104} tick={{ fontSize: 10, fill: "#9c918c" }} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="completed" fill={ADMIN_CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminChart>
      </section>

      <section className="admin-stat-grid">
        {trackStats.map((track) => (
          <StatCard
            key={track.label}
            label={track.label}
            value={`${track.rate}%`}
            delta={track.completed}
            deltaLabel="completed"
            accent={track.accent}
          />
        ))}
      </section>

      <section className="admin-course-grid">
        <div>
          <h2 className="admin-section-title">Drop-off analysis</h2>
          <DataTable columns={dropOffColumns} data={dropOffData} emptyMessage="No lesson progress yet" />
        </div>
        <div>
          <h2 className="admin-section-title">Most replayed lessons</h2>
          <DataTable columns={replayColumns} data={replayData} emptyMessage="No replay data yet" />
        </div>
      </section>

      <section className="admin-panel">
        <h2>Recent completions</h2>
        {recentCompletions.length === 0 ? (
          <p className="admin-panel-muted">No completions yet.</p>
        ) : (
          <div className="admin-completion-feed">
            {recentCompletions.map((item, index) => (
              <article key={`${item.lesson_slug}-${item.completed_at}-${index}`}>
                <span>@{item.profile?.username || "unknown"}</span>
                <p>completed <strong>{item.lessonTitle}</strong></p>
                <time>{formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function buildComfortData(profiles) {
  const counts = { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 };
  profiles.forEach((profile) => {
    const key = profile.learn_comfort_level || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return [
    { key: "beginner", label: "Beginner", value: counts.beginner, color: TRACK_COLORS.beginner },
    { key: "intermediate", label: "Intermediate", value: counts.intermediate, color: TRACK_COLORS.intermediate },
    { key: "advanced", label: "Advanced", value: counts.advanced, color: TRACK_COLORS.advanced },
    { key: "unknown", label: "Not selected", value: counts.unknown, color: TRACK_COLORS.unknown }
  ].filter((item) => item.value > 0);
}

function buildLessonCompletionData(progressRows) {
  const completedBySlug = new Map();
  progressRows
    .filter((row) => row.completed)
    .forEach((row) => completedBySlug.set(row.lesson_slug, (completedBySlug.get(row.lesson_slug) || 0) + 1));

  return learnLessons
    .map((lesson) => ({
      lesson: lesson.title,
      completed: completedBySlug.get(lesson.slug) || 0
    }))
    .sort((a, b) => b.completed - a.completed);
}

function buildDropOffData(progressRows, usageRows) {
  const startedBySlug = new Map();
  const completedBySlug = new Map();

  progressRows.forEach((row) => {
    startedBySlug.set(row.lesson_slug, (startedBySlug.get(row.lesson_slug) || 0) + 1);
    if (row.completed) completedBySlug.set(row.lesson_slug, (completedBySlug.get(row.lesson_slug) || 0) + 1);
  });

  usageRows.forEach((row) => {
    const slug = row.metadata?.lesson_slug;
    if (!slug) return;
    startedBySlug.set(slug, Math.max(startedBySlug.get(slug) || 0, 1));
  });

  return learnLessons
    .map((lesson) => {
      const started = startedBySlug.get(lesson.slug) || 0;
      const completed = completedBySlug.get(lesson.slug) || 0;
      const dropOff = started > 0 ? Math.max(0, Math.round(((started - completed) / started) * 100)) : 0;
      return { lesson: lesson.title, started, completed, dropOff };
    })
    .filter((row) => row.started > 0 || row.completed > 0)
    .sort((a, b) => b.dropOff - a.dropOff || b.started - a.started)
    .slice(0, 12);
}

function buildTrackStats(progressRows) {
  const completedSlugsByUser = new Map();
  progressRows
    .filter((row) => row.completed)
    .forEach((row) => {
      const current = completedSlugsByUser.get(row.user_id) || new Set();
      current.add(row.lesson_slug);
      completedSlugsByUser.set(row.user_id, current);
    });

  const userCount = Math.max(1, completedSlugsByUser.size);

  const baseTracks = learnTracks.map((track) => ({
    label: `${track.title} track`,
    trackNumber: track.track,
    accent: track.color
  }));

  const devOpsSlugs = learnLessons.filter((lesson) => lesson.tag === "devops").map((lesson) => lesson.slug);
  const stats = [...baseTracks, { label: "DevOps track", devOps: true, accent: "#6aa8d4" }];

  return stats.map((track) => {
    const slugs = track.devOps
      ? devOpsSlugs
      : learnLessons.filter((lesson) => lesson.track === track.trackNumber).map((lesson) => lesson.slug);
    const totalNeeded = Math.max(1, slugs.length * userCount);
    let completed = 0;
    completedSlugsByUser.forEach((userSlugs) => {
      slugs.forEach((slug) => {
        if (userSlugs.has(slug)) completed += 1;
      });
    });
    return {
      label: track.label,
      completed,
      rate: Math.round((completed / totalNeeded) * 100),
      accent: track.accent
    };
  });
}

function buildReplayData(usageRows) {
  const eventsByUserLesson = new Map();
  usageRows.forEach((row) => {
    const slug = row.metadata?.lesson_slug;
    if (!slug || !row.user_id) return;
    const key = `${row.user_id}:${slug}`;
    const current = eventsByUserLesson.get(key) || { slug, userId: row.user_id, events: 0 };
    current.events += 1;
    eventsByUserLesson.set(key, current);
  });

  const replayBySlug = new Map();
  eventsByUserLesson.forEach((item) => {
    if (item.events <= 1) return;
    const current = replayBySlug.get(item.slug) || { lesson: lessonTitle(item.slug), users: 0, events: 0 };
    current.users += 1;
    current.events += item.events;
    replayBySlug.set(item.slug, current);
  });

  return Array.from(replayBySlug.values())
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);
}

function lessonTitle(slug) {
  return learnLessons.find((lesson) => lesson.slug === slug)?.title || slug;
}
