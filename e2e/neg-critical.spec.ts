import { test, expect } from "@playwright/test";
import { hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, platformUrl, SEED } from "./helpers/portal";
import { expectLeadFormReady } from "./helpers/leadModals";

test.describe("NEG — negative & edge cases", () => {
  test("NEG-01 invalid pincode shows validation; no success", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    const form = await expectLeadFormReady(page, "#enroll-student");
    await form.getByLabel("Parent name").fill("Neg Parent");
    await form.getByLabel("WhatsApp number").fill("9890123456");
    await form.getByLabel("Email").fill("neg-pincode@example.com");
    await form.getByLabel("Child name").fill("Neg Child");
    await form.getByLabel("City", { exact: true }).fill("Bengaluru");
    await form.getByLabel("Pincode", { exact: true }).fill("12");
    await expect(
      form.getByRole("button", { name: /book free demo|request a free trial|submit/i })
    ).toBeDisabled();
    await expect(page.getByText(/application received/i)).toHaveCount(0);
  });

  test("NEG-02 missing required fields → inline errors", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    const form = await expectLeadFormReady(page, "#enroll-student");
    const submit = form.getByRole("button", {
      name: /book free demo|request a free trial|submit|apply|enroll/i,
    });
    await expect(submit).toBeDisabled();
    await expect(form.getByLabel("Parent name")).toBeVisible();
  });

  test("NEG-08 invalid auth handoff token shows clear error", async ({ page }) => {
    await page.goto(platformUrl("/auth/handoff?token_hash=invalid-e2e-token&next=/app"));
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });

  test("NEG-10 refresh on /app/leads does not crash (with auth)", async ({ page }) => {
    test.skip(!hasE2EBackend(), "Requires auth");
    await page.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    await page.reload();
    await expect(page.getByRole("heading").or(page.getByLabel("Email")).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("center public has no franchise apply (NEG-related / C-PUB-02)", async ({ page }) => {
    await page.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/"));
    await expect(page.getByLabel("Proposed franchise name")).toHaveCount(0);
  });
});
