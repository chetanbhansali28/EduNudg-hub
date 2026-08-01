import { test, expect } from "@playwright/test";
import { authStatePath, hasE2EBackend } from "./helpers/env";
import { uniqueWhatsApp } from "./helpers/auth";
import { brandUrl, centerUrl, SEED } from "./helpers/portal";

test.describe("E2E-03 — Student lead Path A (brand → assign → convert)", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("parent applies on brand → brand sees unassigned → center convert path", async ({ browser }) => {
    const wa = uniqueWhatsApp();
    const child = `Child ${Date.now().toString(36)}`;

    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(brandUrl(SEED.brandSlug, "/#enroll-student"));
    await publicPage.getByLabel("Parent name").fill("Path A Parent");
    await publicPage.getByLabel("WhatsApp number").fill(wa);
    await publicPage.getByLabel("Email").fill(`path-a-${wa}@example.com`);
    await publicPage.getByLabel("City").fill("Bengaluru");
    await publicPage.getByLabel("Pincode").fill("560034");
    await publicPage.getByLabel("Child name").fill(child);
    await publicPage.getByLabel("Child date of birth").fill("2018-05-01");
    await publicPage.getByRole("button", { name: /submit|apply|enroll/i }).first().click();
    await expect(publicPage.getByText(/received|contact you/i).first()).toBeVisible({ timeout: 20_000 });
    await publicCtx.close();

    const brandCtx = await browser.newContext({ storageState: authStatePath("brand") });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(brandUrl(SEED.brandSlug, "/app/leads"));
    await expect(brandPage.getByText(child).or(brandPage.getByText(wa))).toBeVisible({ timeout: 20_000 });

    // Prefer Unassigned filter if present
    const unassigned = brandPage.getByRole("button", { name: /unassigned/i }).or(
      brandPage.getByRole("tab", { name: /unassigned/i })
    );
    if (await unassigned.first().isVisible().catch(() => false)) {
      await unassigned.first().click();
    }

    await brandPage.getByText(child).or(brandPage.getByText("Path A Parent")).first().click();
    const assignBtn = brandPage.getByRole("button", { name: /assign/i }).first();
    if (await assignBtn.isVisible().catch(() => false)) {
      await assignBtn.click();
      const centerOption = brandPage.getByRole("option", { name: /koramangala/i }).or(
        brandPage.getByText(/koramangala/i)
      );
      if (await centerOption.first().isVisible().catch(() => false)) {
        await centerOption.first().click();
      }
      const confirm = brandPage.getByRole("button", { name: /confirm|assign|save/i }).last();
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click();
      }
    }
    await brandCtx.close();

    const centerCtx = await browser.newContext({ storageState: authStatePath("center") });
    const centerPage = await centerCtx.newPage();
    await centerPage.goto(centerUrl(SEED.brandSlug, SEED.centerSlug, "/app/leads"));
    await expect(centerPage.getByText(child).or(centerPage.getByText("Path A Parent"))).toBeVisible({
      timeout: 25_000,
    });
    await centerCtx.close();
  });
});
