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
  await expect(page.locator("main")).toBeVisible();
});

test("taster quiz is reachable and starts", async ({ page }) => {
  await page.goto("/certification/git-fundamentals");
  await page.getByRole("button", { name: /start taster/i }).click();
  await expect(page.locator(".cert-taster-question-shell")).toBeVisible();
});

test("unknown routes do not white-screen", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.locator("body")).not.toBeEmpty();
});
