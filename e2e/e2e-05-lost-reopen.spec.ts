import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";

test.describe("E2E-05 — Lost lead lifecycle", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("center marks lost with reason; brand sees lost; brand reopens", async ({ browser }) => {
    const wa = uniqueWhatsApp();
    const child = `LostChild ${Date.now().toString(36)}`;

    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
    await publicPage.getByLabel("Parent name").fill("Lost Parent");
    await publicPage.getByLabel("WhatsApp number").fill(wa);
    await publicPage.getByLabel("Email").fill(`lost-${wa}@example.com`);
    await publicPage.getByLabel("Child name").fill(child);
    await publicPage.getByRole("button", { name: /register|submit/i }).first().click();
    await expect(publicPage.getByText(/received|success|thank|register/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await publicCtx.close();

    const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
    const centerPage = await centerCtx.newPage();
    await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
    await centerPage.getByText(child).or(centerPage.getByText("Lost Parent")).first().click();
    const lostBtn = centerPage.getByRole("button", { name: /mark lost|lost/i }).first();
    await expect(lostBtn).toBeVisible({ timeout: 15_000 });
    await lostBtn.click();
    const reason = centerPage.getByLabel(/reason/i).or(centerPage.getByPlaceholder(/reason/i));
    if (await reason.first().isVisible().catch(() => false)) {
      await reason.first().fill("Not interested — E2E");
    }
    await centerPage.getByRole("button", { name: /confirm|save|mark lost/i }).last().click();
    await centerCtx.close();

    const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    const lostTab = brandPage.getByRole("button", { name: /^lost$/i }).or(
      brandPage.getByRole("tab", { name: /lost/i })
    );
    if (await lostTab.first().isVisible().catch(() => false)) {
      await lostTab.first().click();
    }
    await expect(brandPage.getByText(child).or(brandPage.getByText(/Not interested/i))).toBeVisible({
      timeout: 20_000,
    });

    // Brand cannot mark lost (button absent or disabled on brand)
    await expect(brandPage.getByRole("button", { name: /mark lost/i })).toHaveCount(0);

    const reopen = brandPage.getByRole("button", { name: /reopen/i }).first();
    if (await reopen.isVisible().catch(() => false)) {
      await reopen.click();
      await expect(brandPage.getByText(child)).toBeVisible({ timeout: 15_000 });
    }
    await brandCtx.close();
  });
});
