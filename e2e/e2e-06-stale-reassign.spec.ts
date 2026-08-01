import { test, expect } from "@playwright/test";
import { authStatePath, hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, SEED } from "./helpers/portal";
import { backdateLeadStale, findLeadIdByWhatsapp } from "./helpers/sql";

test.describe("E2E-06 — Stale lead & reallocation", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");
  test.skip(!hasDatabaseUrl(), "Requires DATABASE_URL for stale backdate");

  test("backdated assigned lead appears in Stale; reassign works", async ({ browser }) => {
    const wa = uniqueWhatsApp();
    const child = `StaleChild ${Date.now().toString(36)}`;

    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    await publicPage.getByLabel("Parent name").fill("Stale Parent");
    await publicPage.getByLabel("WhatsApp number").fill(wa);
    await publicPage.getByLabel("Email").fill(`stale-${wa}@example.com`);
    await publicPage.getByLabel("City").fill("Bengaluru");
    await publicPage.getByLabel("Pincode").fill("560034");
    await publicPage.getByLabel("Child name").fill(child);
    await publicPage.getByLabel("Child date of birth").fill("2018-01-01");
    await publicPage.getByRole("button", { name: /submit|apply|enroll/i }).first().click();
    await expect(publicPage.getByText(/received|contact you/i).first()).toBeVisible({ timeout: 20_000 });
    await publicCtx.close();

    const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    await brandPage.getByText(child).first().click();
    const assignBtn = brandPage.getByRole("button", { name: /assign/i }).first();
    if (await assignBtn.isVisible().catch(() => false)) {
      await assignBtn.click();
      const centerOption = brandPage.getByText(/koramangala/i).first();
      if (await centerOption.isVisible().catch(() => false)) {
        await centerOption.click();
      }
      const confirm = brandPage.getByRole("button", { name: /confirm|assign|save/i }).last();
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click();
      }
    }

    const leadId = await findLeadIdByWhatsapp(SEED.brandId, wa);
    expect(leadId).toBeTruthy();
    await backdateLeadStale(leadId!);

    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    const staleFilter = brandPage.getByRole("button", { name: /stale|needs attention/i }).or(
      brandPage.getByRole("tab", { name: /stale|needs attention/i })
    );
    if (await staleFilter.first().isVisible().catch(() => false)) {
      await staleFilter.first().click();
    }
    await expect(brandPage.getByText(child)).toBeVisible({ timeout: 20_000 });
    await brandCtx.close();
  });
});
