import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { learnUrl, SEED } from "./helpers/portal";

test.describe("E2E-09 — Student learn portal", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.use({ storageState: authStatePath("student") });

  test("login lands on learn dashboard (production routes)", async ({ page }) => {
    await page.goto(learnUrl(SEED.brandSlug, "/"));
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: /dashboard|progress|welcome|learning/i }).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("S-02 production nav includes profile; no merchandise/kits routes", async ({ page }) => {
    await page.goto(learnUrl(SEED.brandSlug, "/"));
    await expect(page.getByRole("link", { name: /profile/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: /merchandise|kits|admin/i })).toHaveCount(0);

    await page.goto(learnUrl(SEED.brandSlug, "/profile"));
    await expect(page.getByText(/student@edunudg\.com|email|profile/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("progress and competitions routes load when present", async ({ page }) => {
    await page.goto(learnUrl(SEED.brandSlug, "/progress"));
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto(learnUrl(SEED.brandSlug, "/competitions"));
    await expect(page).not.toHaveURL(/\/login/);
  });
});
