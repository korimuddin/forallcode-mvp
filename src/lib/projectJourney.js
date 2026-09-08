export const firstProjectLessons = ["commits", "branching", "commit-messages", "pull-request-best-practices", "merging"];

export function nextProjectLesson(completed = []) {
  const reviewed = new Set(completed);
  return firstProjectLessons.find(slug => !reviewed.has(slug)) || null;
}

export function repositoryPath(repo) {
  return `/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
}

export function parsePracticePullRequest(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a GitHub pull request URL."); }
  const match = url.pathname.match(/^\/([\w.-]+)\/([\w.-]+)\/pull\/([1-9]\d*)\/?$/);
  if (url.origin !== "https://github.com" || url.username || url.password || !match) {
    throw new Error("Use a URL like https://github.com/your-name/your-project/pull/1.");
  }
  return { owner: match[1], repo: match[2], number: match[3], url: `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}` };
}

export async function verifyPracticePullRequest(value, token, fetcher = fetch, signal) {
  const target = parsePracticePullRequest(value);
  if (!token) throw new Error("Reconnect GitHub in Settings to check your pull request.");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  async function read(path) {
    const response = await fetcher(`https://api.github.com${path}`, { headers, signal });
    if (!response.ok) throw new Error(response.status === 404
      ? "Pull request not found, or your GitHub connection cannot access it."
      : "GitHub could not complete the check. Check your connection and try again.");
    return response.json();
  }
  const user = await read("/user");
  const path = `/repos/${target.owner}/${target.repo}/pulls/${target.number}`;
  const pull = await read(path);
  if (!user.id || pull.user?.id !== user.id) throw new Error("Choose a pull request authored by your connected GitHub account.");
  if (pull.head?.sha === pull.base?.sha || !pull.head?.sha || !pull.base?.sha) throw new Error("This pull request needs a committed change.");
  if (pull.changed_files > 100) throw new Error("Choose a small practice pull request with no more than 100 changed files.");
  const files = await read(`${path}/files?per_page=100`);
  if (!files.some(file => /(^|\/)readme\.md$/i.test(file.filename) && file.status !== "removed" && file.additions > 0)) {
    throw new Error("This practice task needs a README.md addition or improvement in the pull request.");
  }
  return { ...target, title: pull.title, merged: Boolean(pull.merged), state: pull.state };
}
