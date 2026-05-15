const BASE_URL = "https://api.github.com";
const DEFAULT_TTL = 300_000;
const FAST_TTL = 60_000;

function cacheKey(path) {
  return `ghcache:${path}`;
}

function encodePath(path = "") {
  return String(path)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function readCache(path, ttlMs) {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(cacheKey(path));
    if (!stored) return null;
    const { data, ts } = JSON.parse(stored);
    if (Date.now() - ts < ttlMs) return data;
  } catch {
    return null;
  }
  return null;
}

function writeCache(path, data) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(cacheKey(path), JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Session storage can fill up quickly with large files; the next request can refetch.
  }
}

async function ghFetch(path, { token, ttlMs = DEFAULT_TTL, refresh = false } = {}) {
  if (!refresh) {
    const cached = readCache(path, ttlMs);
    if (cached) return cached;
  }

  const headers = {
    Accept: "application/vnd.github+json"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (!response.ok) {
    const error = new Error(response.status === 403
      ? "GitHub rate limit reached. Connect your GitHub account to continue."
      : response.status === 404
        ? "This GitHub resource does not exist or is private."
        : "Could not reach GitHub. Check your connection.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  writeCache(path, data);
  return data;
}

export function decodeGitHubBase64(content = "") {
  try {
    const binary = atob(String(content).replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

export const githubApi = {
  repo: (owner, repo, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, options),
  readme: (owner, repo, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, options),
  contents: (owner, repo, path = "", ref = "", options = {}) => {
    const encodedPath = encodePath(path);
    const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents${encodedPath ? `/${encodedPath}` : ""}${refQuery}`, options);
  },
  issues: (owner, repo, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=30`, { ...options, ttlMs: FAST_TTL }),
  issue: (owner, repo, number, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(number)}`, { ...options, ttlMs: FAST_TTL }),
  issueComments: (owner, repo, number, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${encodeURIComponent(number)}/comments?per_page=30`, { ...options, ttlMs: FAST_TTL }),
  pulls: (owner, repo, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=30`, { ...options, ttlMs: FAST_TTL }),
  pull: (owner, repo, number, options) => ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(number)}`, { ...options, ttlMs: FAST_TTL }),
  user: (username, options) => ghFetch(`/users/${encodeURIComponent(username)}`, options),
  userRepos: (username, options) => ghFetch(`/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`, options),
  org: (org, options) => ghFetch(`/orgs/${encodeURIComponent(org)}`, options)
};
