import { expect, test } from "@playwright/test";

test("landing page renders hero and GitHub CTA", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: /your first home for code/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
});

test("explore page loads repos or empty state", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Explore", exact: true })).toBeVisible();
  await expect(page.locator(".explore-repo-card, .explore-empty").first()).toBeVisible();
});

test("taster quiz is reachable and starts", async ({ page }) => {
  await page.goto("/certification/git-fundamentals");
  await page.getByRole("button", { name: /start taster/i }).click();
  await expect(page.locator(".cert-taster-question-shell")).toBeVisible();
});

test("unknown routes do not white-screen", async ({ page }) => {
  await page.goto("/missing/path/does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page.getByRole("heading", { name: /your first home for code/i })).toBeVisible();
});

test("markdown strips executable attributes and keeps copy controls", async ({ page }) => {
  await page.goto("/home");
  const html = await page.evaluate(async () => {
    const { renderMarkdown } = await import("/src/lib/markdownRenderer.js");
    return renderMarkdown('<a href="javascript:alert(1)" onclick="alert(1)" onmouseover="alert(1)">unsafe</a>\n\n```js\nconst safe = true;\n```');
  });
  expect(html).not.toMatch(/onclick|onmouseover|javascript:/i);
  expect(html).toContain('data-markdown-copy="true"');
});

for (const route of ["/dashboard", "/workspace", "/profile", "/learn", "/learn/git-basics", "/octocat", "/octocat/Hello-World"]) {
  test(`split route renders: ${route}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://api.github.com/**", route => route.fulfill({ status: 404, contentType: "application/json", body: '{"message":"Not Found"}' }));
    await page.goto(route);
    if (route === "/profile") {
      await expect(page.getByRole("button", { name: "Edit profile", exact: true })).toBeVisible();
    } else {
      await expect(page.locator("h1").first()).toBeVisible();
    }
    await expect(page.getByText("Something needs a little care.", { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
