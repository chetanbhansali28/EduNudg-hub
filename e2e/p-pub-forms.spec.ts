import { test, expect } from "@playwright/test";
import { platformUrl } from "./helpers/portal";

async function expectMarketingHomeReady(page: import("@playwright/test").Page) {
  await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
}

test.describe("P-PUB — platform public marketing", () => {
  test("P-PUB-01 platform homepage loads with brand signup section", async ({ page }) => {
    await page.goto(platformUrl("/"));
    await expectMarketingHomeReady(page);
    await expect(page.getByRole("textbox", { name: "Organization name" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("P-PUB-02 platform homepage has no franchise or student application forms", async ({ page }) => {
    await page.goto(platformUrl("/"));
    await expectMarketingHomeReady(page);
    await expect(page.getByLabel("WhatsApp number")).toHaveCount(0);
    await expect(page.getByLabel("Proposed franchise name")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Register for a free trial/i })).toHaveCount(0);
  });

  test("P-PUB-03 Sign in CTA goes to /login", async ({ page }) => {
    await page.goto(platformUrl("/"));
    await expectMarketingHomeReady(page);

    // Platform chrome always exposes at least one /login entry:
    // - nav "Login" (EnterpriseNav)
    // - footer "Sign in" (CMS product links, when configured)
    // - default nav CTA "Get Started" → /login (DEFAULT_HOMEPAGE_CONFIG)
    const loginCta = page.locator('a[href="/login"]').first();
    await expect(loginCta).toBeVisible({ timeout: 15_000 });
    await loginCta.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
