import { test, expect } from "@playwright/test";

async function expectLoginFormReady(page: import("@playwright/test").Page) {
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
}

async function expectMarketingHomeReady(page: import("@playwright/test").Page) {
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
}

test("login page renders split-screen form", async ({ page }) => {
  await page.goto("/login");
  await expectLoginFormReady(page);
  await expect(page.getByText(/EduNudg platform account/i)).toBeVisible();
  // exact: true — "Log in with Google/Facebook" also match substring "Log in"
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
});

test("login page exposes default alternate sign-in options", async ({ page }) => {
  await page.goto("/login");
  await expectLoginFormReady(page);
  await expect(page.getByRole("button", { name: "Log in with Google", exact: true })).toBeVisible();
});

test("regression_login_primary_submit_name_is_exact_not_oauth", async ({ page }) => {
  await page.goto("/login");
  await expectLoginFormReady(page);
  const primary = page.getByRole("button", { name: "Log in", exact: true });
  await expect(primary).toBeVisible();
  await expect(primary).toHaveAttribute("type", "submit");
  // Substring "Log in" also matches OAuth buttons — callers must use exact: true
  expect(await page.getByRole("button", { name: "Log in" }).count()).toBeGreaterThan(1);
});

test("P-PUB-01 / UX-01 marketing home renders shared nav and footer", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  // exact: true — getByLabel("Site") also matches "Launch Website for FREE" CTAs
  await expect(page.getByRole("navigation", { name: "Site", exact: true })).toBeVisible();
  await expectMarketingHomeReady(page);
});

test("regression_marketing_home_then_login_survives_shared_query_cache", async ({ page }) => {
  // Favicon/shell fetch HomepageConfig under ["marketing-homepage"]; public chrome
  // must use a distinct bundle key or /login stays on Loading… forever.
  await page.goto("/");
  await expectMarketingHomeReady(page);
  await page.goto("/login");
  await expectLoginFormReady(page);
});

function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test("regression_no_console_errors_on_login", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/login");
  await expectLoginFormReady(page);
  expect(errors).toEqual([]);
});

test("regression_no_console_errors_on_marketing_home", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await expectMarketingHomeReady(page);
  expect(errors).toEqual([]);
});
