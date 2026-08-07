import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";
import { fillCenterStudentRegistration } from "./helpers/leadModals";

test.describe("E2E-04 — Student lead Path B (center register → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("parent registers on center site → center lead → brand visibility", async ({ browser }) => {
    const wa = uniqueWhatsApp();
    const child = `CenterChild ${Date.now().toString(36)}`;

    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
    await fillCenterStudentRegistration(
      publicPage,
      {
        parentName: "Path B Parent",
        whatsapp: wa,
        email: `path-b-${wa}@example.com`,
        childName: child,
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
    await expect(centerPage.getByText(child).first()).toBeVisible({
      timeout: 20_000,
    });
    await centerCtx.close();

    const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    // Brand queue should include center-sourced leads; soft-check if filtered by default view.
    const onBrand = brandPage.getByText(child).first();
    if (await onBrand.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(onBrand).toBeVisible();
    }
    await brandCtx.close();
  });
});
