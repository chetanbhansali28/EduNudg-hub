import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";

test.describe("E2E-04 — Student lead Path B (center register → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("parent registers on center site → center lead → brand visibility", async ({ browser }) => {
    const wa = uniqueWhatsApp();
    const child = `CenterChild ${Date.now().toString(36)}`;

    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/#register"));
    await publicPage.getByLabel("Parent name").fill("Path B Parent");
    await publicPage.getByLabel("WhatsApp number").fill(wa);
    await publicPage.getByLabel("Email").fill(`path-b-${wa}@example.com`);
    await publicPage.getByLabel("Child name").fill(child);
    await publicPage.getByRole("button", { name: /register|submit/i }).first().click();
    await expect(publicPage.getByText(/received|success|thank|register/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await publicCtx.close();

    const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
    const centerPage = await centerCtx.newPage();
    await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
    await expect(centerPage.getByText(child).or(centerPage.getByText("Path B Parent"))).toBeVisible({
      timeout: 20_000,
    });
    await centerCtx.close();

    const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    await expect(brandPage.getByText(child).or(brandPage.getByText("Path B Parent"))).toBeVisible({
      timeout: 20_000,
    });
    await brandCtx.close();
  });
});
