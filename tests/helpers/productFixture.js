import { loadEnv } from "vite";

const origin = loadEnv("development", process.cwd(), "VITE_").VITE_SUPABASE_URL;
export async function productFixture(page, { theme = "light", empty = false, onboarding = true, progress = [], progressError = false, saveError = false, provider = false } = {}) {
  if (!origin) throw new Error("Tests need the configured Supabase URL; all service calls are intercepted.");
  const user = { id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", role: "authenticated", email: "product@example.test", user_metadata: { name: "Test User", user_name: "test-user" }, app_metadata: { provider: "github" } };
  const profile = { id: user.id, username: "test-user", display_name: "Test User", avatar_style: "sage", onboarding_completed: onboarding, learn_comfort_level: "beginner" };
  const repos = empty ? [] : [{ id: "22222222-2222-4222-8222-222222222222", owner_id: user.id, name: "demo-project", description: "A small project for learning Git and explaining decisions.", language: "JavaScript", github_repo_id: 1, is_private: false, stars_count: 0, created_at: "2026-09-01T12:00:00Z", updated_at: "2026-09-08T12:00:00Z", readme_content: "# demo-project\n\nA useful project.", profiles: { username: "test-user" } }];
  const storageKey = `sb-${new URL(origin).hostname.split(".")[0]}-auth-token`;
  await page.addInitScript(({ storageKey, user, theme, provider }) => {
    localStorage.setItem(storageKey, JSON.stringify({ access_token: "product-test-token", refresh_token: "product-test-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user, ...(provider ? { provider_token: "github-fixture-token" } : {}) }));
    localStorage.setItem("forallcode-appearance", JSON.stringify({ theme }));
  }, { storageKey, user, theme, provider });
  await page.route(`${origin}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split("/").at(-1);
    let body = [];
    let status = 200;
    if (table === "user") body = user;
    if (table === "profiles") {
      if (request.method() === "PATCH" && saveError) { status = 500; body = { message: "Save unavailable" }; }
      else { if (request.method() === "PATCH") Object.assign(profile, request.postDataJSON()); body = profile; }
    }
    if (table === "subscriptions") body = { plan_id: "free", status: "active", plans: { name: "Free" } };
    if (table === "repositories") body = request.headers().accept?.includes("object") ? repos[0] || null : repos;
    if (table === "learn_progress") {
      if (progressError || (saveError && request.method() === "POST")) { status = 500; body = { message: "Progress unavailable" }; }
      else if (request.method() === "POST") { const row = request.postDataJSON(); progress.push(row.lesson_slug); body = row; }
      else body = progress.map(slug => ({ lesson_slug: slug, completed: true }));
    }
    await route.fulfill({ status, contentType: "application/json", headers: { "content-range": "0-0/0" }, body: JSON.stringify(body) });
  });
  await page.route("https://api.github.com/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body = [];
    if (path === "/user") body = { id: 42, login: "test-user" };
    else if (path === "/user/repos") body = repos.map(repo => ({ ...repo, id: 1, private: false, owner: { login: "test-user" }, default_branch: "main" }));
    else if (path.endsWith("/pulls/1/files")) body = [{ filename: "README.md", status: "modified", additions: 3 }];
    else if (path.endsWith("/pulls/1")) body = { title: "Explain how the project works", user: { id: 42 }, head: { sha: "new" }, base: { sha: "old" }, changed_files: 1, state: "open", merged: false };
    else if (path === "/repos/test-user/demo-project") body = { name: "demo-project", default_branch: "main", owner: { login: "test-user" } };
    else if (path.includes("/git/trees/")) body = { tree: [] };
    else if (path.endsWith("/readme")) body = { content: "", encoding: "base64" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.routeWebSocket(/supabase/, socket => socket.close());
  return { profile, repos };
}
