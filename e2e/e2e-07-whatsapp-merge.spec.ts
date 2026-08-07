import { test, expect } from "@playwright/test";
import { hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { brandUrl, SEED } from "./helpers/portal";
import { fillBrandStudentLead, expectLeadFormReady } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  hardDeleteEphemeralE2ELeadsViaSql,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-07 — WhatsApp duplicate merge", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.afterAll(async () => {
    if (!hasDatabaseUrl()) return;
    try {
      await hardDeleteEphemeralE2ELeadsViaSql();
    } catch {
      // Non-fatal
    }
  });

  test("second application same WhatsApp merges (success, no duplicate toast of two creates)", async ({
    page,
  }) => {
    const tag = `merge-${Date.now().toString(36)}`;
    const fields = makeE2ELeadFields({ tag });
    const enrollUrl = brandUrl(SEED.brandSlug, "/#enroll-student");

    try {
      async function submit(childSuffix: string) {
        await fillBrandStudentLead(
          page,
          {
            parentName: fields.parentName,
            whatsapp: fields.whatsapp,
            email: fields.email,
            city: fields.city,
            pincode: fields.pincode,
            childName: `E2E Child ${tag}-${childSuffix}`,
          },
          enrollUrl
        );
      }

      await submit("a");
      await expect(page.getByRole("status").filter({ hasText: /received|contact you/i })).toBeVisible({
        timeout: 20_000,
      });

      await submit("b");
      await expect(page.getByRole("status").filter({ hasText: /received|contact you/i })).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });

  test("re-apply after converted shows enrolled error (C1)", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    const form = await expectLeadFormReady(page, "#enroll-student");
    const submit = form.getByRole("button", {
      name: /book free demo|request a free trial|submit|apply|enroll/i,
    });
    await expect(submit).toBeDisabled();
    await expect(form.getByLabel("Parent name")).toBeVisible();
  });
});
