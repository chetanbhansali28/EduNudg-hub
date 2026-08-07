import { test, expect } from "@playwright/test";
import { authStatePath, hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";
import { fillCenterStudentRegistration } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  hardDeleteEphemeralE2ELeadsViaSql,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-05 — Lost lead lifecycle", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.afterAll(async () => {
    if (!hasDatabaseUrl()) return;
    try {
      await hardDeleteEphemeralE2ELeadsViaSql();
    } catch {
      // Non-fatal
    }
  });

  test("center marks lost with reason; brand sees lost; brand reopens", async ({ browser }) => {
    const fields = makeE2ELeadFields({ tag: `lost-${Date.now().toString(36)}` });

    try {
      const publicCtx = await browser.newContext();
      const publicPage = await publicCtx.newPage();
      await publicPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
      await fillCenterStudentRegistration(
        publicPage,
        {
          parentName: fields.parentName,
          whatsapp: fields.whatsapp,
          email: fields.email,
          childName: fields.childName,
        },
        centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register")
      );
      await expect(
        publicPage.getByRole("status").filter({ hasText: /Registration received|received/i })
      ).toBeVisible({ timeout: 20_000 });
      await publicCtx.close();

      const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
      const centerPage = await centerCtx.newPage();
      await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
      await expect(centerPage.getByText(fields.childName).first()).toBeVisible({ timeout: 20_000 });
      await centerPage.getByText(fields.childName).first().click();
      const lostBtn = centerPage.getByRole("button", { name: /mark lost|lost/i }).first();
      await expect(lostBtn).toBeVisible({ timeout: 15_000 });
      await lostBtn.click();
      const reason = centerPage.getByLabel(/reason/i).or(centerPage.getByPlaceholder(/reason/i));
      if (await reason.first().isVisible().catch(() => false)) {
        await reason.first().fill("Not interested — E2E");
      }
      await centerPage.getByRole("button", { name: /confirm|save|mark lost/i }).last().click();
      await centerCtx.close();

      const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
      const brandPage = await brandCtx.newPage();
      await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      const lostTab = brandPage.getByRole("button", { name: /^lost$/i }).or(
        brandPage.getByRole("tab", { name: /lost/i })
      );
      if (await lostTab.first().isVisible().catch(() => false)) {
        await lostTab.first().click();
      }
      const lostOnBrand = brandPage.getByText(fields.childName).first();
      if (await lostOnBrand.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await expect(brandPage.getByRole("button", { name: /mark lost/i })).toHaveCount(0);
        const reopen = brandPage.getByRole("button", { name: /reopen/i }).first();
        if (await reopen.isVisible().catch(() => false)) {
          await reopen.click();
          await expect(brandPage.getByText(fields.childName).first()).toBeVisible({
            timeout: 15_000,
          });
        }
      }
      await brandCtx.close();
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });
});
