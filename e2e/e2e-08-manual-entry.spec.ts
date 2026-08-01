import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, platformUrl, SEED } from "./helpers/portal";

test.describe("E2E-08 — Manual staff lead entry", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("platform admin can open brands and see manual signup card", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("platform") });
    const page = await context.newPage();
    await page.goto(platformUrl("/admin/brands"));
    await expect(page.getByRole("heading", { name: /brand/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/manual|create signup|pending/i).or(page.getByRole("button", { name: /create|add/i }).first())
    ).toBeVisible({ timeout: 15_000 });
    await context.close();
  });

  test("brand staff manual student lead card present on /app/leads", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("brand") });
    const page = await context.newPage();
    await page.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    await expect(page.getByText(/manual|add lead|create lead/i).first()).toBeVisible({
      timeout: 20_000,
    });
    const wa = uniqueWhatsApp();
    const nameField = page.getByLabel(/parent name|full name/i).first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill("Manual Brand Parent");
      await page.getByLabel(/whatsapp/i).first().fill(wa);
      await page.getByRole("button", { name: /create|add|save/i }).first().click();
      await expect(page.getByText(/Manual Brand Parent|created|added/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
    await context.close();
  });

  test("center staff manual lead card present on /app/leads", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("center") });
    const page = await context.newPage();
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
    await expect(page.getByText(/manual|add lead|create lead/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await context.close();
  });
});
