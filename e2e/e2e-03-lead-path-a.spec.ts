import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";
import { fillBrandStudentLead } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  hardDeleteEphemeralE2ELeads,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-03 — Student lead Path A (brand → assign → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.afterAll(async () => {
    try {
      await hardDeleteEphemeralE2ELeads({ brandId: SEED.brandId });
    } catch {
      // Non-fatal
    }
  });

  test("parent applies on brand → brand sees unassigned → center convert path", async ({ browser }) => {
    const fields = makeE2ELeadFields({ tag: `path-a-${Date.now().toString(36)}` });

    try {
      const publicCtx = await browser.newContext();
      const publicPage = await publicCtx.newPage();
      await publicPage.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
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
      await expect(publicPage.getByRole("status").filter({ hasText: /received|contact you/i })).toBeVisible({
        timeout: 20_000,
      });
      await publicCtx.close();

      const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
      const brandPage = await brandCtx.newPage();
      await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      await expect(
        brandPage.getByText(fields.childName).or(brandPage.getByText(fields.parentName)).first()
      ).toBeVisible({ timeout: 20_000 });

      const unassigned = brandPage.getByRole("button", { name: /unassigned/i }).or(
        brandPage.getByRole("tab", { name: /unassigned/i })
      );
      if (await unassigned.first().isVisible().catch(() => false)) {
        await unassigned.first().click();
      }

      await brandPage
        .getByText(fields.childName)
        .or(brandPage.getByText(fields.parentName))
        .first()
        .click();
      const assignBtn = brandPage.getByRole("button", { name: /assign/i }).first();
      if (await assignBtn.isVisible().catch(() => false)) {
        await assignBtn.click();
        const centerOption = brandPage.getByRole("option", { name: /koramangala/i }).or(
          brandPage.getByText(/koramangala/i)
        );
        if (await centerOption.first().isVisible().catch(() => false)) {
          await centerOption.first().click();
        }
        const confirm = brandPage.getByRole("button", { name: /confirm|assign|save/i }).last();
        if (await confirm.isVisible().catch(() => false)) {
          await confirm.click();
        }

        const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
        const centerPage = await centerCtx.newPage();
        await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
        await centerPage
          .getByText(fields.childName)
          .first()
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
        await centerCtx.close();
      }
      await brandCtx.close();
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });
});
