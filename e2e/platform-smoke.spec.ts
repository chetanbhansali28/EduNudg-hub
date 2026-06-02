import { test, expect } from "@playwright/test";

test("login page renders split-screen form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(page.getByText(/EduNudg platform account/i)).toBeVisible();
  await expect(page.getByLabelText("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("login page exposes alternate sign-in options", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "More sign-in options" }).click();
  await expect(page.getByText("Google")).toBeVisible();
});

test("marketing home renders shared nav and footer", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByLabelText("Site")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
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
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible({ timeout: 10_000 });
  expect(errors).toEqual([]);
});

test("regression_no_console_errors_on_marketing_home", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});
