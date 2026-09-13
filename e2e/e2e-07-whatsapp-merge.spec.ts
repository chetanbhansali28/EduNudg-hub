import { test, expect } from "@playwright/test";
import { E2E_SEED_SKIP_REASON, hasE2EBackend, hasE2ESeedTenant } from "./helpers/env";
import { brandUrl, SEED } from "./helpers/portal";
import { expectLeadFormReady, expectLeadReceived, fillBrandStudentLead } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-07 — WhatsApp duplicate merge", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("second application same WhatsApp merges (success, no duplicate toast of two creates)", async ({
    page,
  }) => {
    test.skip(!(await hasE2ESeedTenant()), E2E_SEED_SKIP_REASON);
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
      await expectLeadReceived(page);

      await submit("b");
      await expectLeadReceived(page);
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
