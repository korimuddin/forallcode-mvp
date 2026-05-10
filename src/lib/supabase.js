import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : null;

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGitHub() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo user:email",
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
}

export async function signInWithPassword(email, password) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function syncGitHubRepos(githubAccessToken) {
  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
    headers: { Authorization: `Bearer ${githubAccessToken}` }
  });

  if (!response.ok) {
    throw new Error("Could not sync GitHub repositories.");
  }

  return response.json();
}

export async function fetchGitHubReceivedEvents(username, githubAccessToken) {
  if (!username || !githubAccessToken) return [];

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/received_events?per_page=20`, {
    headers: { Authorization: `Bearer ${githubAccessToken}` }
  });

  if (!response.ok) {
    throw new Error("Could not load GitHub activity from followed accounts.");
  }

  return response.json();
}

async function fetchGitHubJson(path, githubAccessToken) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed for ${path}.`);
  }

  return response.json();
}

export async function fetchGitHubRepoOverview(owner, repo, githubAccessToken) {
  if (!owner || !repo || !githubAccessToken) return null;

  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);
  const repoPath = `/repos/${encodedOwner}/${encodedRepo}`;
  const repository = await fetchGitHubJson(repoPath, githubAccessToken);
  const defaultBranch = repository.default_branch || "main";

  const [treeResult, commitsResult, branchesResult, forksResult, pullsResult, readmeResult] = await Promise.allSettled([
    fetchGitHubJson(`${repoPath}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`, githubAccessToken),
    fetchGitHubJson(`${repoPath}/commits?per_page=20`, githubAccessToken),
    fetchGitHubJson(`${repoPath}/branches?per_page=50`, githubAccessToken),
    fetchGitHubJson(`${repoPath}/forks?sort=newest&per_page=10`, githubAccessToken),
    fetchGitHubJson(`${repoPath}/pulls?state=all&per_page=10`, githubAccessToken),
    fetchGitHubJson(`${repoPath}/readme`, githubAccessToken)
  ]);

  return {
    repository,
    defaultBranch,
    files: treeResult.status === "fulfilled" ? mapGitHubTree(treeResult.value?.tree || []) : [],
    commits: commitsResult.status === "fulfilled" ? commitsResult.value.map(mapGitHubCommit) : [],
    branches: branchesResult.status === "fulfilled" ? branchesResult.value.map((branch) => mapGitHubBranch(branch, defaultBranch)) : [],
    forks: forksResult.status === "fulfilled" ? forksResult.value.map(mapGitHubFork) : [],
    pulls: pullsResult.status === "fulfilled" ? pullsResult.value.map(mapGitHubPull) : [],
    readme: readmeResult.status === "fulfilled" ? decodeGitHubContent(readmeResult.value?.content) : ""
  };
}

export function getSessionIdentity(session) {
  const metadata = session?.user?.user_metadata || {};
  const emailName = session?.user?.email?.split("@")[0] || "";
  const username = metadata.user_name || metadata.preferred_username || metadata.login || emailName || "user";
  const displayName = metadata.full_name || metadata.name || username;

  return {
    username,
    displayName,
    avatarUrl: metadata.avatar_url || "",
    email: session?.user?.email || ""
  };
}

export async function upsertProfileFromSession(session) {
  if (!supabase || !session?.user?.id) return null;

  const identity = getSessionIdentity(session);
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: session.user.id,
      username: identity.username,
      display_name: identity.displayName,
      github_username: identity.username
    }, { onConflict: "id" })
    .select("username, display_name, avatar_style, github_username")
    .maybeSingle();

  if (error) {
    console.warn("Could not persist profile in Supabase.", error);
    return null;
  }
  return data;
}

export function mapGitHubRepo(repo, ownerUsername) {
  return {
    githubRepoId: repo.id,
    name: repo.name,
    owner: ownerUsername || repo.owner?.login || "",
    description: repo.description || "No description yet.",
    language: repo.language || "Code",
    private: Boolean(repo.private),
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updated: formatRelativeDate(repo.updated_at),
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    pinned: false,
    topic: repo.topics?.[0] || "repo",
    landing: false
  };
}

export async function syncGitHubReposToSupabase(session) {
  if (!session?.provider_token) return [];

  const profile = await upsertProfileFromSession(session);
  const identity = getSessionIdentity(session);
  const githubRepos = await syncGitHubRepos(session.provider_token);
  const mappedRepos = githubRepos.map((repo) => mapGitHubRepo(repo, profile?.username || identity.username));

  if (supabase && session?.user?.id && mappedRepos.length > 0) {
    const { error } = await supabase
      .from("repositories")
      .upsert(mappedRepos.map((repo) => ({
        owner_id: session.user.id,
        github_repo_id: repo.githubRepoId,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        is_private: repo.private,
        stars_count: repo.stars,
        forks_count: repo.forks,
        updated_at: repo.updatedAt,
        created_at: repo.createdAt
      })), { onConflict: "github_repo_id" });

    if (error) console.warn("Could not persist repositories in Supabase.", error);
  }

  return mappedRepos;
}

export async function syncGitHubActivity(session) {
  if (!session?.provider_token) return [];

  const identity = getSessionIdentity(session);
  const events = await fetchGitHubReceivedEvents(identity.username, session.provider_token);

  return events
    .filter((event) => event?.actor?.login && event?.repo?.name)
    .slice(0, 10)
    .map((event) => mapGitHubEvent(event));
}

function mapGitHubEvent(event) {
  const actor = event.actor?.display_login || event.actor?.login || "Someone";
  const repoName = event.repo?.name || "a repository";
  const action = eventAction(event);

  return {
    id: event.id,
    name: actor,
    initials: actor.slice(0, 2).toUpperCase(),
    action: `${action} ${repoName}`,
    time: formatRelativeDate(event.created_at),
    live: false
  };
}

function eventAction(event) {
  const actions = {
    CommitCommentEvent: "commented on",
    CreateEvent: "created something in",
    DeleteEvent: "deleted something in",
    ForkEvent: "forked",
    IssuesEvent: `${event.payload?.action || "updated"} an issue in`,
    IssueCommentEvent: `${event.payload?.action || "commented on"} an issue in`,
    PullRequestEvent: `${event.payload?.action || "updated"} a pull request in`,
    PullRequestReviewEvent: `${event.payload?.action || "reviewed"} a pull request in`,
    PushEvent: "pushed to",
    ReleaseEvent: `${event.payload?.action || "published"} a release in`,
    WatchEvent: "starred"
  };

  return actions[event.type] || "updated";
}

function mapGitHubTree(tree) {
  return tree
    .filter((item) => item.type === "tree" || item.type === "blob")
    .sort((a, b) => {
      if (a.path.split("/").length !== b.path.split("/").length) {
        return a.path.split("/").length - b.path.split("/").length;
      }
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.path.localeCompare(b.path);
    })
    .slice(0, 120)
    .map((item) => ({
      path: item.path,
      name: item.path.split("/").pop(),
      indent: Math.min(item.path.split("/").length - 1, 4),
      type: item.type === "tree" ? "folder" : "file"
    }));
}

function mapGitHubCommit(commit) {
  const author = commit.commit?.author?.name || commit.author?.login || "Unknown";

  return {
    hash: commit.sha?.slice(0, 7) || "",
    message: commit.commit?.message?.split("\n")[0] || "Commit",
    author,
    time: formatRelativeDate(commit.commit?.author?.date || commit.commit?.committer?.date),
    url: commit.html_url || ""
  };
}

function mapGitHubBranch(branch, defaultBranch) {
  return {
    name: branch.name,
    default: branch.name === defaultBranch,
    updated: branch.commit?.sha ? branch.commit.sha.slice(0, 7) : "Latest",
    sha: branch.commit?.sha || ""
  };
}

function mapGitHubFork(fork) {
  return {
    name: fork.full_name || fork.name,
    owner: fork.owner?.login || "",
    updated: formatRelativeDate(fork.updated_at)
  };
}

function mapGitHubPull(pull) {
  return {
    number: pull.number,
    title: pull.title,
    state: pull.merged_at ? "merged" : pull.state,
    head: pull.head?.ref || "",
    base: pull.base?.ref || "main",
    updated: formatRelativeDate(pull.updated_at)
  };
}

function decodeGitHubContent(content) {
  if (!content) return "";
  try {
    const binary = atob(content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function formatRelativeDate(value) {
  if (!value) return "Recently";
  const timestamp = new Date(value).getTime();
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} minutes ago`;
  if (diff < day) return `${Math.round(diff / hour)} hours ago`;
  if (diff < 2 * day) return "Yesterday";
  return `${Math.round(diff / day)} days ago`;
}
