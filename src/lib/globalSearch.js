import { learnLessons, learnTracks } from "../data/learnLessons";
import { supabase } from "./supabase";

const DEFAULT_LIMIT = 10;

function searchPattern(query) {
  return `%${String(query || "").trim().replace(/[,%]/g, " ")}%`;
}

export function searchLessons(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return [];

  return learnLessons
    .filter((lesson) => (
      lesson.title.toLowerCase().includes(normalized)
      || lesson.description.toLowerCase().includes(normalized)
      || lesson.tag.toLowerCase().includes(normalized)
    ))
    .map((lesson) => ({
      ...lesson,
      trackName: learnTracks.find((track) => track.track === lesson.track)?.title || "Learn"
    }))
    .slice(0, DEFAULT_LIMIT);
}

export async function performSearch(query, type = "all") {
  const trimmed = String(query || "").trim();
  const results = { repos: [], users: [], issues: [], lessons: [] };
  if (!trimmed) return results;

  const pattern = searchPattern(trimmed);
  const tasks = [];

  if (supabase && (type === "all" || type === "repos")) {
    tasks.push(
      supabase
        .from("repositories")
        .select("*, profiles!repositories_owner_id_fkey(username, avatar_style)")
        .eq("is_private", false)
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .order("stars_count", { ascending: false })
        .limit(DEFAULT_LIMIT)
        .then(({ data }) => {
          results.repos = data || [];
        })
    );
  }

  if (supabase && (type === "all" || type === "users")) {
    tasks.push(
      supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.${pattern},display_name.ilike.${pattern},bio.ilike.${pattern}`)
        .limit(DEFAULT_LIMIT)
        .then(({ data }) => {
          results.users = data || [];
        })
    );
  }

  if (supabase && (type === "all" || type === "issues")) {
    tasks.push(
      supabase
        .from("issues")
        .select("*, repositories!issues_repo_id_fkey(name, is_private, profiles!repositories_owner_id_fkey(username))")
        .eq("repositories.is_private", false)
        .or(`title.ilike.${pattern},body.ilike.${pattern}`)
        .limit(DEFAULT_LIMIT)
        .then(({ data }) => {
          results.issues = data || [];
        })
    );
  }

  if (type === "all" || type === "lessons") {
    results.lessons = searchLessons(trimmed);
  }

  await Promise.all(tasks);
  return results;
}

export function flattenSearchResults(results) {
  return [
    ...(results.repos || []).map((repo) => ({
      id: `repo-${repo.id || repo.github_repo_id || repo.name}`,
      type: "repos",
      title: repo.name,
      meta: `@${repo.profiles?.username || "user"}`,
      path: `/${repo.profiles?.username || "repo"}/${repo.name}`,
      raw: repo
    })),
    ...(results.users || []).map((user) => ({
      id: `user-${user.id || user.username}`,
      type: "users",
      title: `@${user.username}`,
      meta: user.display_name || "",
      path: `/${user.username}`,
      raw: user
    })),
    ...(results.issues || []).map((issue) => ({
      id: `issue-${issue.id}`,
      type: "issues",
      title: issue.title,
      meta: `#${issue.number} · ${issue.repositories?.name || "repo"}`,
      path: `/${issue.repositories?.profiles?.username || "repo"}/${issue.repositories?.name || "issues"}/issues/${issue.number}`,
      raw: issue
    })),
    ...(results.lessons || []).map((lesson) => ({
      id: `lesson-${lesson.slug}`,
      type: "lessons",
      title: lesson.title,
      meta: lesson.trackName || lesson.tag,
      path: `/learn/${lesson.slug}`,
      raw: lesson
    }))
  ];
}
