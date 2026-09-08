import { expect, test } from "@playwright/test";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "VITE_");
const origin = env.VITE_SUPABASE_URL;
const user = { id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", role: "authenticated", email: "navigation@example.test", user_metadata: { name: "Test User" }, app_metadata: { provider: "email" } };

async function signInFixture(page, theme = "light") {
  if (!origin) throw new Error("Navigation tests require the project's Supabase URL to seed an isolated browser session.");
  const storageKey = `sb-${new URL(origin).hostname.split(".")[0]}-auth-token`;
  await page.addInitScript(({ storageKey, user, theme }) => {
    localStorage.setItem(storageKey, JSON.stringify({ access_token: "navigation-test-token", refresh_token: "navigation-test-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user }));
    localStorage.setItem("forallcode-appearance", JSON.stringify({ theme }));
  }, { storageKey, user, theme });
  await page.route(`${origin}/**`, async route => {
    const url = new URL(route.request().url());
    let body = [];
    if (url.pathname.endsWith("/user")) body = user;
    if (url.pathname.endsWith("/profiles")) body = { id: user.id, username: "test-user", display_name: "Test User", avatar_style: "sage", onboarding_completed: true };
    if (url.pathname.endsWith("/subscriptions")) body = { plan_id: "free", status: "active", plans: { name: "Free" } };
    if (url.pathname.endsWith("/repositories")) body = [{ name: "navigation-demo", language: "TypeScript", profiles: { username: "test-user" } }];
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "content-range": "0-0/0" }, body: JSON.stringify(body) });
  });
  await page.routeWebSocket(/supabase/, socket => socket.close());
  await page.goto("/home");
}

test("desktop navigation opens with keyboard, switches menus and follows routes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await signInFixture(page);
  const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  const repos = nav.getByRole("button", { name: "Repos", exact: true });
  await repos.focus();
  await page.keyboard.press("Enter");
  await expect(repos).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowDown");
  await expect(nav.getByRole("link", { name: /Your repos/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(repos).toHaveAttribute("aria-expanded", "false");
  await expect(repos).toBeFocused();
  await repos.hover();
  await expect(nav.getByRole("link", { name: "navigation-demo" })).toBeVisible();
  await nav.getByRole("button", { name: "Learn", exact: true }).hover();
  await expect(nav.getByRole("link", { name: "Git Fundamentals Certificate", exact: true })).toBeVisible();
  await nav.getByRole("link", { name: "Git Fundamentals Certificate", exact: true }).click();
  await expect(page).toHaveURL(/\/certification\/git-fundamentals$/);
  await expect(page.getByRole("complementary", { name: "Platform navigation" })).toBeVisible();
  await expect(page.locator('[data-slot="navigation-menu-content"][data-state="open"]')).toHaveCount(0);
});

for (const theme of ["light", "dark"]) {
  for (const width of [1440, 1024, 390, 320]) {
    test(`${theme} navigation fits at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await signInFixture(page, theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      if (width <= 1240) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await expect(page.getByRole("button", { name: "Close navigation" })).toHaveAttribute("aria-expanded", "true");
      }
      const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
      await nav.getByRole("button", { name: "Learn", exact: true }).click();
      const content = nav.locator('[data-slot="navigation-menu-content"][data-state="open"]');
      await expect(content).toBeVisible();
      const bounds = await content.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await expect(content).toHaveCSS("border-radius", "0px");
      await expect(content).toHaveCSS("opacity", "1");
      await expect(content).toHaveCSS("background-color", theme === "dark" ? "rgb(23, 28, 31)" : "rgb(255, 255, 255)");
      await expect.poll(() => content.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + 20));
      })).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}.png`), fullPage: false });
      await nav.getByRole("button", { name: "Repos", exact: true }).click();
      await expect(nav.getByRole("link", { name: "navigation-demo" })).toBeVisible();
      await expect(content).toHaveCSS("opacity", "1");
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}-repos.png`), fullPage: false });
      if (width <= 1240) {
        await nav.getByRole("link", { name: "Explore", exact: true }).click();
        await expect(page).toHaveURL(/\/explore$/);
        await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
      }
    });
  }
}

test.describe("touch navigation", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("tap opens a menu and follows a destination", async ({ page }) => {
    await signInFixture(page);
    await page.getByRole("button", { name: "Open navigation" }).tap();
    const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
    await nav.getByRole("button", { name: "Learn", exact: true }).tap();
    await nav.getByRole("link", { name: "Git Fundamentals Certificate", exact: true }).tap();
    await expect(page).toHaveURL(/\/certification\/git-fundamentals$/);
    await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Open navigation" }).tap();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  });
});
