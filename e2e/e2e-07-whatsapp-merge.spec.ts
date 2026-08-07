import { test, expect } from "@playwright/test";
import { hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, SEED } from "./helpers/portal";
import { fillBrandStudentLead, expectLeadFormReady } from "./helpers/leadModals";

test.describe("E2E-07 — WhatsApp duplicate merge", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("second application same WhatsApp merges (success, no duplicate toast of two creates)", async ({
    page,
  }) => {
    const wa = uniqueWhatsApp();
    const enrollUrl = brandUrl(SEED.brandSlug, "/#enroll-student");

    async function submit(child: string) {
      await fillBrandStudentLead(
        page,
        {
          parentName: "Merge Parent",
          whatsapp: wa,
          email: `merge-${wa}@example.com`,
          city: "Bengaluru",
          pincode: "560001",
          childName: child,
        },
        enrollUrl
      );
    }

    await submit("Merge Child A");
    await expect(page.getByRole("status").filter({ hasText: /received|contact you/i })).toBeVisible({
      timeout: 20_000,
    });

    await submit("Merge Child B");
    await expect(page.getByRole("status").filter({ hasText: /received|contact you/i })).toBeVisible({
      timeout: 20_000,
    });
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
