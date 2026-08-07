import { test, expect } from "@playwright/test";
import { centerUrl, SEED } from "./helpers/portal";
import { expectLeadFormReady } from "./helpers/leadModals";

/**
 * Replaces prior skipped host-header stub.
 * Uses hybrid portal overrides (CI) — set E2E_USE_LOCAL_HOSTS=1 for *.localhost.
 * Seeded abacusworld theme is Novu (inline #register); modal themes use dialog[open].
 */
test.describe("center public enrollment smoke", () => {
  test("center host loads and exposes registration anchor", async ({ page }) => {
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
    const form = await expectLeadFormReady(page, "#register");
    await expect(form.getByRole("textbox", { name: "Parent name" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
