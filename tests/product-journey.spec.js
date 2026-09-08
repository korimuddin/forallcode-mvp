import { expect, test } from "@playwright/test";
import { productFixture } from "./helpers/productFixture";

test("dashboard uses saved progress instead of a hardcoded lesson", async ({ page }) => {
  await productFixture(page, { progress: ["commits"] });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Next: Branching" })).toBeVisible();
  await page.getByRole("link", { name: "Open your next lesson" }).click();
  await expect(page).toHaveURL(/\/learn\/branching$/);
  await expect(page.locator(".lesson-content h2").first()).toHaveText("Branching");
});

test("an empty account gets a real project creation action", async ({ page }) => {
  await productFixture(page, { empty: true });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Create your first project" })).toHaveAttribute("href", "/repos/new");
  await expect(page.getByText("No followed activity yet.", { exact: false })).not.toBeVisible();
});

test("progress errors do not masquerade as a fresh account", async ({ page }) => {
  await productFixture(page, { progressError: true });
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Retry progress" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open your next lesson" })).toHaveCount(0);
});

test("onboarding has two steps and surfaces a failed save", async ({ page }) => {
  await productFixture(page, { onboarding: false, saveError: true });
  await page.goto("/dashboard");
  const dialog = page.getByRole("dialog", { name: "ForAllCode onboarding" });
  await expect(dialog.getByText("Step 1 of 2", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dialog.getByText("Step 2 of 2", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Start with commits" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Save unavailable");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("lesson save failure does not mark it reviewed", async ({ page }) => {
  await productFixture(page, { saveError: true });
  await page.goto("/learn/commits");
  await page.getByRole("button", { name: "Mark lesson reviewed" }).click();
  await expect(page.getByRole("alert")).toContainText("Your progress was not saved");
  await expect(page.getByRole("button", { name: "Mark lesson reviewed" })).toBeEnabled();
  await expect(page.locator(".lesson-sidebar .lucide-lock")).toHaveCount(0);
});

test("project practice verifies an owned README pull request without writing to GitHub", async ({ page }) => {
  await productFixture(page, { provider: true });
  const writes = [];
  page.on("request", request => { if (request.url().startsWith("https://api.github.com/") && request.method() !== "GET") writes.push(request.method()); });
  await page.goto("/learn/commits");
  await page.getByLabel("Your GitHub pull request URL").fill("https://github.com/test-user/demo-project/pull/1");
  await page.getByRole("button", { name: "Check my pull request" }).click();
  await expect(page.getByText("README change verified on GitHub")).toBeVisible();
  expect(writes).toEqual([]);
  await page.getByLabel("Your GitHub pull request URL").fill("https://github.com/test-user/demo-project/pull/2");
  await expect(page.getByText("README change verified on GitHub")).toHaveCount(0);
});

test("case-study template requires confirmation and is available for free", async ({ page }) => {
  await productFixture(page);
  await page.goto("/test-user/demo-project/readme");
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Project case study/ }).click();
  await expect(page.getByRole("textbox", { name: "README markdown" })).toContainText("## My contribution");
  await expect(page.getByRole("button", { name: "Commit to GitHub" })).toBeVisible();
});

for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    test(`${theme} community theme covers platform routes at ${width}px`, async ({ page }, testInfo) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 960 });
      await productFixture(page, { theme });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const routes = ["/dashboard", "/repos", "/learn/commits", "/settings/account", "/test-user/demo-project/issues", "/test-user/demo-project/pulls", "/test-user/demo-project/discussions", "/workspace", "/upgrade", "/marketplace", "/profile", "/test-user/portfolio", "/test-user/demo-project/readme", "/home"];
      for (const [index, route] of routes.entries()) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByText("Something went wrong.", { exact: true })).toHaveCount(0);
        await expect(page.locator(".app-shell > main")).toBeVisible();
        await expect(page.locator(".skeleton").first()).not.toBeVisible({ timeout: 10000 });
        await expect(page.locator("body")).toHaveCSS("background-color", theme === "dark" ? "rgb(14, 17, 19)" : "rgb(255, 255, 255)");
        const bounds = await page.locator(".app-shell > main").boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
        await page.screenshot({ path: testInfo.outputPath(`${index}-${route.replaceAll("/", "-")}.png`), fullPage: false });
      }
      expect(errors).toEqual([]);
    });
  }
}
