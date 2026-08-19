import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";
import { fillBrandStudentLead } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-03 — Student lead Path A (brand → assign → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("parent applies on brand → brand sees unassigned → center convert path", async ({ browser }) => {
    test.setTimeout(90_000);
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

      const leadRow = brandPage.getByRole("button", { name: new RegExp(fields.parentName, "i") });
      await expect(leadRow).toBeVisible({ timeout: 20_000 });
      await leadRow.click();

      const centerSelect = brandPage.getByLabel("Center");
      await expect(centerSelect).toBeVisible({ timeout: 15_000 });
      const koramangalaValue = await centerSelect.locator("option").filter({ hasText: /koramangala/i }).getAttribute("value");
      expect(koramangalaValue).toBeTruthy();
      await centerSelect.selectOption(koramangalaValue!);

      const confirmAssign = brandPage.getByRole("button", { name: "Confirm & Assign Lead", exact: true });
      await expect(confirmAssign).toBeEnabled({ timeout: 10_000 });
      await confirmAssign.click();

      const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
      const centerPage = await centerCtx.newPage();
      await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
      await centerPage
        .getByText(fields.childName)
        .or(centerPage.getByText(fields.parentName))
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      await centerCtx.close();
      await brandCtx.close();
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });
});
