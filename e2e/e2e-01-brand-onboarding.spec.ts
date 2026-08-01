import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { platformUrl, brandUrl, SEED } from "./helpers/portal";

test.describe("E2E-01 — New brand onboarding", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.use({ storageState: authStatePath("platform") });

  test("visitor signup → admin pending → approve → brand host", async ({ page, browser }) => {
    const suffix = Date.now().toString(36);
    const orgName = `E2E Brand ${suffix}`;
    const email = `e2e-brand-${suffix}@example.com`;

    await page.goto(platformUrl("/#brand-signup"));
    await page.getByLabel("Organization name").fill(orgName);
    await page.getByLabel("Admin name").fill("E2E Admin");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Phone").fill("9890111222");
    await page.getByLabel("City").fill("Bengaluru");
    await page.getByRole("button", { name: /submit|request|launch/i }).first().click();
    await expect(page.getByText(/received|submitted|thank/i).first()).toBeVisible({ timeout: 20_000 });

    await page.goto(platformUrl("/admin/brands"));
    await expect(page.getByText(orgName).or(page.getByText(email))).toBeVisible({ timeout: 20_000 });

    const approve = page.getByRole("button", { name: /approve/i }).first();
    await expect(approve).toBeVisible({ timeout: 15_000 });
    await approve.click();
    await expect(page.getByText(/approved|active/i).first()).toBeVisible({ timeout: 30_000 });

    // Duplicate email cannot create second pending signup
    await page.goto(platformUrl("/#brand-signup"));
    await page.getByLabel("Organization name").fill(`${orgName} Dup`);
    await page.getByLabel("Admin name").fill("E2E Admin");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Phone").fill("9890111223");
    await page.getByLabel("City").fill("Bengaluru");
    await page.getByRole("button", { name: /submit|request|launch/i }).first().click();
    await expect(page.getByText(/already|exists|pending|duplicate/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("seeded brand host loads public marketing (slug + domain mapping)", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });
});
