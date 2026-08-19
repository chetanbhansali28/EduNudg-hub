import { test, expect } from "@playwright/test";
import { hasE2EBackend } from "./helpers/env";
import { brandUrl, SEED } from "./helpers/portal";

test.describe("Public course detail", () => {
  test.skip(!hasE2EBackend(), "Requires VITE_SUPABASE_URL + anon key");

  test("homepage course control opens /courses/:slug with theme nav", async ({ page }) => {
    await page.goto(brandUrl(SEED.brandSlug, "/"));
    await expect(page.getByText("Loading…")).toHaveCount(0, { timeout: 20_000 });

    const courseLink = page.locator('a[href^="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 20_000 });
    const href = await courseLink.getAttribute("href");
    expect(href).toMatch(/^\/courses\//);

    await courseLink.click();
    await expect(page).toHaveURL(new RegExp(`${href?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("navigation").or(page.getByRole("banner")).first()).toBeVisible();
  });
});
