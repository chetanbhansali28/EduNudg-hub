import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";

test.describe("E2E-02 — Franchise application → center live", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("applicant submits franchise application on brand public site", async ({ page }) => {
    const suffix = Date.now().toString(36);
    await page.goto(brandUrl(SEED.brandSlug, "/#apply"));
    await page.getByLabel("Full name").fill(`Franchise Applicant ${suffix}`);
    await page.getByLabel("Email").fill(`franchise-${suffix}@example.com`);
    await page.getByLabel("Phone").fill(uniqueWhatsApp());
    await page.getByLabel("Preferred city").fill("Bengaluru");
    await page.getByLabel("Proposed franchise name").fill(`Center ${suffix}`);
    await page.getByRole("button", { name: /submit|apply/i }).first().click();
    await expect(page.getByText(/received|submitted|thank|success/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("brand owner sees franchise applications queue", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("brand") });
    const page = await context.newPage();
    await page.goto(brandUrl(SEED.brandSlug, "/app/franchise-applications"));
    await expect(page.getByRole("heading", { name: /franchise/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });

  test("seeded center host loads student registration only — no franchise form", async ({ page }) => {
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Proposed franchise name")).toHaveCount(0);
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
    await expect(page.getByLabel("Parent name").or(page.getByLabel("WhatsApp number"))).toBeVisible({
      timeout: 15_000,
    });
  });
});
