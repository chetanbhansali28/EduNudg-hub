import { test, expect } from "@playwright/test";
import { hasE2EBackend } from "./helpers/env";
import { brandUrl, centerUrl, platformUrl, SEED } from "./helpers/portal";

test.describe("NEG — negative & edge cases", () => {
  test("NEG-01 invalid pincode shows validation; no success", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    const form = page.locator("#enroll-student");
    await form.getByLabel("Parent name").fill("Neg Parent");
    await form.getByLabel("WhatsApp number").fill("9890123456");
    await form.getByLabel("Email").fill("neg-pincode@example.com");
    await form.getByLabel("City").fill("Bengaluru");
    await form.getByLabel("Pincode").fill("12");
    await form.getByLabel("Child date of birth").fill("2018-01-01");
    await expect(form.getByText(/6-digit India pincode/i)).toBeVisible({ timeout: 10_000 });
    await expect(form.getByRole("button", { name: /request a free trial|submit/i })).toBeDisabled();
    await expect(page.getByText(/application received/i)).toHaveCount(0);
  });

  test("NEG-02 missing required fields → inline errors", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    await page.getByRole("button", { name: /submit|apply|enroll/i }).first().click();
    // Button disabled or error message
    const disabled = await page
      .getByRole("button", { name: /submit|apply|enroll/i })
      .first()
      .isDisabled()
      .catch(() => false);
    const errVisible = await page
      .getByText(/required|enter|pincode|whatsapp/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(disabled || errVisible).toBeTruthy();
  });

  test("NEG-08 invalid auth handoff token shows clear error", async ({ page }) => {
    // Invalid token_hash forces verifyOtp failure (or env throw in CI without Supabase).
    await page.goto(platformUrl("/auth/handoff?token_hash=invalid-e2e-token&next=/app"));
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /go to login/i })).toBeVisible();
  });

  test("NEG-10 refresh on /app/leads does not crash (with auth)", async ({ page }) => {
    test.skip(!hasE2EBackend(), "Requires auth");
    // Unauthenticated refresh should land login without white screen
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
