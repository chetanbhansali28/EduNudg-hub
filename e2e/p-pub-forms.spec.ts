import { test, expect } from "@playwright/test";
import { platformUrl } from "./helpers/portal";

test.describe("P-PUB — platform public marketing", () => {
  test("P-PUB-01 platform homepage loads with brand signup section", async ({ page }) => {
    await page.goto(platformUrl("/"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("textbox", { name: "Organization name" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("P-PUB-02 platform homepage has no franchise or student application forms", async ({ page }) => {
    await page.goto(platformUrl("/"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("WhatsApp number")).toHaveCount(0);
    await expect(page.getByLabel("Proposed franchise name")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Register for a free trial/i })).toHaveCount(0);
  });

  test("P-PUB-03 Sign in CTA goes to /login", async ({ page }) => {
    await page.goto(platformUrl("/"));
    const signIn = page.getByRole("link", { name: /sign in|log in/i }).first();
    await expect(signIn).toBeVisible({ timeout: 15_000 });
    await signIn.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
