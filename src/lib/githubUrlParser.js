const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

function cleanParts(pathname) {
  return pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
}

export function isGitHubUrl(url) {
  try {
    return GITHUB_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function parseGitHubUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) return null;

  const parts = cleanParts(parsed.pathname);
  if (!parts.length) return null;

  if (parts[0] === "orgs" && parts[1]) {
    return {
      type: "org",
      org: parts[1],
      htmlUrl: parsed.href
    };
  }

  const [owner, repo, section, ...rest] = parts;
  if (!owner) return null;
  if (!repo) {
    return {
      type: "user",
      username: owner,
      htmlUrl: parsed.href
    };
  }

  if (!section) {
    return {
      type: "repo",
      owner,
      repo,
      htmlUrl: parsed.href
    };
  }

  if (section === "blob") {
    const [branch, ...fileParts] = rest;
    if (!branch || !fileParts.length) return { type: "repo", owner, repo, htmlUrl: parsed.href };
    return {
      type: "file",
      owner,
      repo,
      branch,
      path: fileParts.join("/"),
      htmlUrl: parsed.href
    };
  }

  if (section === "tree") {
    const [branch, ...dirParts] = rest;
    return {
      type: "tree",
      owner,
      repo,
      branch: branch || "",
      path: dirParts.join("/"),
      htmlUrl: parsed.href
    };
  }

  if (section === "issues") {
    return rest[0]
      ? { type: "issue", owner, repo, number: Number(rest[0]), htmlUrl: parsed.href }
      : { type: "issues", owner, repo, htmlUrl: parsed.href };
  }

  if (section === "pulls" || section === "pull") {
    return rest[0]
      ? { type: "pull", owner, repo, number: Number(rest[0]), htmlUrl: parsed.href }
      : { type: "pulls", owner, repo, htmlUrl: parsed.href };
  }

  return {
    type: "repo",
    owner,
    repo,
    htmlUrl: parsed.href
  };
}
