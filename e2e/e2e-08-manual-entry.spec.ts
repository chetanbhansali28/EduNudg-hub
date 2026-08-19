import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, platformUrl, SEED } from "./helpers/portal";
import {
  cleanupEphemeralE2ELead,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

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
    const fields = makeE2ELeadFields({ tag: `manual-${Date.now().toString(36)}` });
    const context = await browser.newContext({ storageState: authStatePath("brand") });
    const page = await context.newPage();
    try {
      await page.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      const newLead = page.getByRole("button", { name: "+ New Lead", exact: true });
      await expect(newLead).toBeVisible({ timeout: 20_000 });
      await newLead.click();
      await page.getByLabel("Parent name").fill(fields.parentName);
      await page.getByLabel("WhatsApp number").fill(fields.whatsapp);
      await page.getByLabel("Email", { exact: true }).fill(fields.email);
      await page.getByLabel("City", { exact: true }).fill(fields.city);
      await page.getByLabel("Pincode", { exact: true }).fill(fields.pincode);
      await page.getByLabel("Student name").fill(fields.childName);
      await page.getByRole("button", { name: "Create lead", exact: true }).click();
      await expect(
        page.getByText(new RegExp(`${fields.parentName}|created|added`, "i")).first()
      ).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await context.close();
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
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
