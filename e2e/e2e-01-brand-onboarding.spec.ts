import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { platformUrl, brandUrl, SEED } from "./helpers/portal";
import {
  cleanupEphemeralE2EBrand,
  hardDeleteEphemeralE2EBrands,
} from "./helpers/brandCleanup";

test.describe("E2E-01 — New brand onboarding", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.use({ storageState: authStatePath("platform") });

  test.afterAll(async () => {
    // Sweep leftovers (SQL or platform RPC) so /admin/subscriptions stays clean.
    try {
      await hardDeleteEphemeralE2EBrands();
    } catch {
      // Non-fatal: individual tests still clean up via cleanupEphemeralE2EBrand.
    }
  });

  test("visitor signup → admin pending → approve → brand host", async ({ browser, page }) => {
    const suffix = Date.now().toString(36);
    const orgName = `E2E Brand ${suffix}`;
    const email = `e2e-brand-${suffix}@example.com`;

    try {
      const publicCtx = await browser.newContext();
      const publicPage = await publicCtx.newPage();
      await publicPage.goto(platformUrl("/"));
      await publicPage.goto(platformUrl("/#brand-signup"));
      await expect(publicPage.getByLabel("Organization name")).toBeVisible({ timeout: 15_000 });
      await publicPage.getByLabel("Organization name").fill(orgName);
      await publicPage.getByLabel("Admin name").fill("E2E Admin");
      await publicPage.getByLabel("Work email").fill(email);
      await publicPage.getByLabel("Phone").fill("9890111222");
      await publicPage.getByLabel("City").fill("Bengaluru");
      await publicPage.getByRole("button", { name: /submit|request|launch/i }).first().click();
      await expect(publicPage.getByRole("status").filter({ hasText: /received|thank/i })).toBeVisible({
        timeout: 20_000,
      });
      await publicCtx.close();

      await page.goto(platformUrl("/admin/brands"));
      const pending = page.locator(".ed-brands-signup-review").getByText(orgName, { exact: true });
      await expect(pending).toBeVisible({ timeout: 30_000 });
      await pending.click();

      const approve = page.getByRole("button", { name: /approve/i }).first();
      await expect(approve).toBeVisible({ timeout: 15_000 });
      await approve.click();
      await expect(page.locator(".ed-brands-signup-review").getByText(orgName)).toHaveCount(0, {
        timeout: 30_000,
      });

      // Approved brand appears in the active list (desktop row; mobile card is display:none).
      await expect(
        page.locator("article.ed-directory-brand-row").filter({ hasText: orgName })
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await cleanupEphemeralE2EBrand({ page, orgName });
    }

    await page.goto(platformUrl("/admin/brands"));
    await expect(page.locator("article.ed-directory-brand-row").filter({ hasText: orgName })).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page.locator(".ed-brands-signup-review").getByText(orgName, { exact: true })).toHaveCount(0, {
      timeout: 5_000,
    });
  });

  test("seeded brand host loads public marketing (slug + domain mapping)", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });
});
