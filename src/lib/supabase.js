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

export async function fetchGitHubFileContent(owner, repo, path, githubAccessToken, ref) {
  if (!owner || !repo || !path || !githubAccessToken) return null;

  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);
  const encodedPath = encodeGitHubPath(path);
  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const file = await fetchGitHubJson(`/repos/${encodedOwner}/${encodedRepo}/contents/${encodedPath}${refQuery}`, githubAccessToken);

  return {
    name: file.name || path.split("/").pop(),
    path: file.path || path,
    size: file.size || 0,
    encoding: file.encoding || "",
    downloadUrl: file.download_url || "",
    content: file.content ? decodeGitHubContent(file.content) : "",
    type: file.type || "file"
  };
}

export async function fetchGitHubRepoArchive(owner, repo, githubAccessToken, ref = "main") {
  if (!owner || !repo || !githubAccessToken) return null;

  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);
  const response = await fetch(`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/zipball/${encodeURIComponent(ref)}`, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not download repository archive from GitHub.");
  }

  return response.blob();
}

export async function forkGitHubRepository(owner, repo, githubAccessToken) {
  if (!owner || !repo || !githubAccessToken) {
    throw new Error("Sign in with GitHub repo access before forking this repository.");
  }

  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/forks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "GitHub could not fork this repository.");
  }

  return payload;
}

export async function createGitHubRepository(session, options) {
  if (!session?.provider_token) {
    throw new Error("Sign in with GitHub repo access before creating a repository.");
  }

  const name = normalizeRepositoryName(options.name);
  if (!name) throw new Error("Add a repository name first.");
  const addLicence = options.addLicence && options.licenceId && options.licenceId !== "none";
  const gitignoreTemplate = options.gitignoreTemplate === "React" ? "Node" : options.gitignoreTemplate;
  const shouldAutoInit = Boolean(options.addReadme || options.addGitignore || addLicence);

  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.provider_token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      description: options.description || undefined,
      private: options.visibility === "private",
      auto_init: shouldAutoInit,
      gitignore_template: options.addGitignore ? gitignoreTemplate || undefined : undefined,
      license_template: addLicence ? options.licenceId : undefined
    })
  });

  const repository = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(repository?.message || "GitHub could not create this repository.");
  }

  if (options.template && !options.usesGitHubInitializers) {
    const files = getRepositoryTemplateFiles(options.template, name, options.description);
    for (const file of files) {
      await createGitHubRepositoryFile(session.provider_token, repository.owner.login, repository.name, file.path, file.content);
    }
  }

  if (supabase && session?.user?.id) {
    await supabase.from("repositories").upsert({
      owner_id: session.user.id,
      github_repo_id: repository.id,
      name: repository.name,
      description: repository.description || "",
      language: repository.language || null,
      is_private: repository.private,
      stars_count: repository.stargazers_count || 0,
      forks_count: repository.forks_count || 0,
      updated_at: repository.updated_at,
      created_at: repository.created_at
    }, { onConflict: "github_repo_id" });
  }

  return mapGitHubRepo(repository, repository.owner.login);
}

export async function checkGitHubRepositoryAvailability(session, owner, repoName) {
  if (!session?.provider_token) {
    throw new Error("Sign in with GitHub before checking repository names.");
  }

  const ownerName = normalizeRepositoryName(owner);
  const name = normalizeRepositoryName(repoName);
  if (!ownerName || !name) return { available: false, message: "Add an owner and repository name." };

  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(ownerName)}/${encodeURIComponent(name)}`, {
    headers: {
      Authorization: `Bearer ${session.provider_token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (response.status === 404) {
    return { available: true, message: "Repository name is available." };
  }

  if (response.ok) {
    return { available: false, message: "That repository name is already taken." };
  }

  const payload = await response.json().catch(() => null);
  throw new Error(payload?.message || "Could not check repository availability.");
}

async function createGitHubRepositoryFile(githubAccessToken, owner, repo, path, content) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeGitHubPath(path)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Add ${path}`,
      content: encodeBase64(content)
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Could not create ${path} in GitHub.`);
  }
}

export async function saveGitHubRepositoryFile({
  githubAccessToken,
  owner,
  repo,
  path,
  content = "",
  contentBase64 = "",
  message = "",
  branch = ""
}) {
  if (!githubAccessToken) throw new Error("Sign in with GitHub repo access before saving files.");
  if (!owner || !repo) throw new Error("Repository details are missing.");

  const normalizedPath = String(path || "").replace(/^\/+/, "").trim();
  if (!normalizedPath) throw new Error("Add a file path first.");

  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeGitHubPath(normalizedPath)}`;
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const existingResponse = await fetch(`${contentsUrl}${refQuery}`, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json"
    }
  });
  const existing = existingResponse.ok ? await existingResponse.json() : null;

  if (!existingResponse.ok && existingResponse.status !== 404) {
    const payload = await existingResponse.json().catch(() => null);
    throw new Error(payload?.message || "Could not check this file on GitHub.");
  }

  if (existing?.type && existing.type !== "file") {
    throw new Error("That path already exists as a folder on GitHub.");
  }

  const response = await fetch(contentsUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: message || `${existing?.sha ? "Update" : "Add"} ${normalizedPath}`,
      content: contentBase64 || encodeBase64(content),
      ...(branch ? { branch } : {}),
      ...(existing?.sha ? { sha: existing.sha } : {})
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Could not save this file to GitHub.");
  }

  return payload;
}

function getRepositoryTemplateFiles(template, name, description) {
  const readme = `# ${name}\n\n${description || "A ForAllCode project."}\n\n## Getting started\n\nDescribe the project, how to run it, and how new contributors can help.\n`;

  const templates = {
    empty: [
      { path: "README.md", content: readme }
    ],
    starter: [
      { path: "README.md", content: readme },
      { path: "docs/.gitkeep", content: "" },
      { path: "src/.gitkeep", content: "" }
    ],
    web: [
      { path: "README.md", content: readme },
      { path: "index.html", content: "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>ForAllCode Project</title>\n  </head>\n  <body>\n    <main>\n      <h1>Hello from ForAllCode</h1>\n    </main>\n  </body>\n</html>\n" },
      { path: "src/styles.css", content: "body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: #faf7f2;\n  color: #3d3530;\n}\n" }
    ],
    docs: [
      { path: "README.md", content: readme },
      { path: "docs/index.md", content: `# ${name} docs\n\nStart documenting the project here.\n` },
      { path: "docs/getting-started.md", content: "# Getting started\n\nAdd setup notes here.\n" }
    ]
  };

  return templates[template] || templates.starter;
}

function normalizeRepositoryName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
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
    .select("*")
    .maybeSingle();

  if (error) {
    console.warn("Could not persist profile in Supabase.", error);
    return null;
  }
  return data;
}

export async function uploadProfileVisualImage(session, kind, imageBlob) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!session?.user?.id) throw new Error("Sign in before uploading profile images.");
  if (!imageBlob) throw new Error("Choose an image first.");
  if (imageBlob.size > 1024 * 1024) {
    throw new Error("This image is still over 1MB after compression. Please choose a smaller image.");
  }

  const safeKind = slugForStorage(kind || "image");
  const path = `${session.user.id}/${safeKind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("profile-visuals")
    .upload(path, imageBlob, {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: true
    });

  if (error) {
    throw new Error(error.message || "Could not upload this profile image.");
  }

  const { data } = supabase.storage.from("profile-visuals").getPublicUrl(path);
  return data.publicUrl;
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
    landing: false,
    heroImageUrl: repo.hero_image_url || "",
    heroPositionX: repo.hero_position_x ?? 50,
    heroPositionY: repo.hero_position_y ?? 50,
    heroTitle: repo.hero_title || "",
    heroFont: repo.hero_font || ""
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

  const storedRepos = await fetchStoredRepositoryHeroFields(session);
  return mergeStoredHeroFields(mappedRepos, storedRepos);
}

export async function fetchStoredRepositoryHeroFields(session) {
  if (!supabase || !session?.user?.id) return [];

  const { data, error } = await supabase
    .from("repositories")
    .select("github_repo_id, name, hero_image_url, hero_position_x, hero_position_y, hero_title, hero_font")
    .eq("owner_id", session.user.id);

  if (error) {
    console.warn("Could not load repository hero settings from Supabase.", error);
    return [];
  }

  return data || [];
}

export function mapStoredRepository(row, ownerUsername) {
  return {
    githubRepoId: row.github_repo_id,
    name: row.name,
    owner: ownerUsername || "",
    description: row.description || "No description yet.",
    language: row.language || "Code",
    private: Boolean(row.is_private),
    stars: row.stars_count || 0,
    forks: row.forks_count || 0,
    updated: formatRelativeDate(row.updated_at),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    pinned: false,
    topic: "repo",
    landing: false,
    ...mapRepoHeroFields(row)
  };
}

export function mergeStoredHeroFields(repos, storedRepos) {
  if (!storedRepos?.length) return repos;
  const byGithubId = new Map(storedRepos.filter((repo) => repo.github_repo_id).map((repo) => [repo.github_repo_id, repo]));
  const byName = new Map(storedRepos.map((repo) => [repo.name, repo]));

  return repos.map((repo) => {
    const stored = byGithubId.get(repo.githubRepoId) || byName.get(repo.name);
    return stored ? { ...repo, ...mapRepoHeroFields(stored) } : repo;
  });
}

export function mapRepoHeroFields(row = {}) {
  return {
    heroImageUrl: row.hero_image_url || "",
    heroPositionX: Number.isFinite(Number(row.hero_position_x)) ? Number(row.hero_position_x) : 50,
    heroPositionY: Number.isFinite(Number(row.hero_position_y)) ? Number(row.hero_position_y) : 50,
    heroTitle: row.hero_title || "",
    heroFont: row.hero_font || ""
  };
}

export async function uploadRepoHeroImage(session, owner, repo, imageBlob) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!session?.user?.id) throw new Error("Sign in before uploading a hero image.");
  if (!imageBlob) throw new Error("Choose a hero image first.");
  if (imageBlob.size > 1024 * 1024) {
    throw new Error("This image is still over 1MB after compression. Please choose a smaller image.");
  }

  const safeOwner = slugForStorage(owner || "owner");
  const safeRepo = slugForStorage(repo || "repo");
  const path = `${session.user.id}/${safeOwner}/${safeRepo}/hero-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("repo-heroes")
    .upload(path, imageBlob, {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: true
    });

  if (error) {
    throw new Error(error.message || "Could not upload the hero image to Supabase Storage.");
  }

  const { data } = supabase.storage.from("repo-heroes").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveRepoHeroToSupabase(session, repoName, hero) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!session?.user?.id) throw new Error("Sign in before saving this hero.");

  const { data, error } = await supabase
    .from("repositories")
    .update({
      hero_image_url: hero.image || null,
      hero_position_x: hero.positionX ?? 50,
      hero_position_y: hero.positionY ?? 50,
      hero_title: hero.title || repoName,
      hero_font: hero.fontFamily || null
    })
    .eq("owner_id", session.user.id)
    .eq("name", repoName)
    .select("hero_image_url, hero_position_x, hero_position_y, hero_title, hero_font")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not save the repository hero settings.");
  }
  if (!data) {
    throw new Error("Could not find this repository in Supabase. Sync your repos and try again.");
  }

  return mapRepoHeroFields(data);
}

function slugForStorage(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "item";
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
      type: item.type === "tree" ? "folder" : "file",
      sha: item.sha || "",
      size: item.size || 0
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

function encodeGitHubPath(path) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
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
