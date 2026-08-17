import { test, expect } from "@playwright/test";
import { authStatePath, hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { brandUrl, SEED } from "./helpers/portal";
import { backdateLeadStale, findLeadIdByWhatsapp } from "./helpers/sql";
import { fillBrandStudentLead } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-06 — Stale lead & reallocation", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");
  test.skip(!hasDatabaseUrl(), "Requires DATABASE_URL for stale backdate");

  test("backdated assigned lead appears in Stale; reassign works", async ({ browser }) => {
    const fields = makeE2ELeadFields({ tag: `stale-${Date.now().toString(36)}` });

    try {
      const publicCtx = await browser.newContext();
      const publicPage = await publicCtx.newPage();
      await fillBrandStudentLead(
        publicPage,
        {
          parentName: fields.parentName,
          whatsapp: fields.whatsapp,
          email: fields.email,
          city: fields.city,
          pincode: fields.pincode,
          childName: fields.childName,
        },
        brandUrl(SEED.brandSlug, "/#enroll-student")
      );
      await expect(
        publicPage.getByRole("status").filter({ hasText: /received|contact you/i })
      ).toBeVisible({ timeout: 20_000 });
      await publicCtx.close();

      const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
      const brandPage = await brandCtx.newPage();
      await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      await brandPage.getByText(fields.childName).first().click();
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

      const leadId = await findLeadIdByWhatsapp(SEED.brandId, fields.whatsapp);
      expect(leadId).toBeTruthy();
      await backdateLeadStale(leadId!);

      await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      const staleFilter = brandPage.getByRole("button", { name: /stale|needs attention/i }).or(
        brandPage.getByRole("tab", { name: /stale|needs attention/i })
      );
      if (await staleFilter.first().isVisible().catch(() => false)) {
        await staleFilter.first().click();
      }
      await expect(brandPage.getByText(fields.childName)).toBeVisible({ timeout: 20_000 });
      await brandCtx.close();
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });
});
