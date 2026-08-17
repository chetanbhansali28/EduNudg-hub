import { test, expect } from "@playwright/test";
import { hasE2EBackend } from "./helpers/env";
import { brandUrl, SEED } from "./helpers/portal";

test.describe("Brand public login chrome", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("regression_brand_login_renders_public_nav_and_footer", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/login"));
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".marketing-page--login")).toBeVisible();
    await expect(
      page.locator("header.ac-nav, header.sa-nav, .novu-nav-bar").first()
    ).toBeVisible();
    await expect(
      page.locator("footer.ac-footer, footer.sa-site-footer, .novu-footer-section").first()
    ).toBeVisible();
  });
});
