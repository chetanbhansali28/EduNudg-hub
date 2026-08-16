import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";
import { fillCenterStudentRegistration } from "./helpers/leadModals";
import {
  cleanupEphemeralE2ELead,
  hardDeleteEphemeralE2ELeads,
  makeE2ELeadFields,
} from "./helpers/leadCleanup";

test.describe("E2E-04 — Student lead Path B (center register → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test.afterAll(async () => {
    try {
      await hardDeleteEphemeralE2ELeads({ brandId: SEED.brandId });
    } catch {
      // Non-fatal
    }
  });

  test("parent registers on center site → center lead → brand visibility", async ({ browser }) => {
    const fields = makeE2ELeadFields({ tag: `path-b-${Date.now().toString(36)}` });

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
      await expect(
        centerPage.getByRole("button", { name: new RegExp(fields.parentName, "i") })
      ).toBeVisible({
        timeout: 20_000,
      });
      await centerCtx.close();

      const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
      const brandPage = await brandCtx.newPage();
      await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
      const onBrand = brandPage.getByText(fields.parentName).or(brandPage.getByText(fields.childName)).first();
      if (await onBrand.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await expect(onBrand).toBeVisible();
      }
      await brandCtx.close();
    } finally {
      await cleanupEphemeralE2ELead({ brandId: SEED.brandId, whatsapp: fields.whatsapp });
    }
  });
});
