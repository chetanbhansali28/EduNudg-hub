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
    await expect(page.getByRole("button", { name: "+ Add brand", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await context.close();
  });

  test("brand staff manual student lead card present on /app/leads", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("brand") });
    const page = await context.newPage();
    await page.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    const newLead = page.getByRole("button", { name: "+ New Lead", exact: true });
    await expect(newLead).toBeVisible({ timeout: 20_000 });
    await newLead.click();
    const wa = uniqueWhatsApp();
    await page.getByLabel("Parent name").fill("Manual Brand Parent");
    await page.getByLabel("WhatsApp number").fill(wa);
    await page.getByLabel("Email").fill(`manual-${wa}@example.com`);
    await page.getByLabel("City", { exact: true }).fill("Bengaluru");
    await page.getByLabel("Pincode", { exact: true }).fill("560034");
    await page.getByLabel("Child name").fill(`ManualChild ${Date.now().toString(36)}`);
    await page.getByRole("button", { name: "Create lead", exact: true }).click();
    await expect(page.getByText(/Manual Brand Parent|created|added/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await context.close();
  });

  test("center staff manual lead card present on /app/leads", async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath("center") });
    const page = await context.newPage();
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
    await expect(
      page.getByRole("button", { name: /\+ New Lead|\+ Add lead|Add lead/i }).first()
    ).toBeVisible({ timeout: 20_000 });
    await context.close();
  });
});
