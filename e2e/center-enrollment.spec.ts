import { test, expect } from "@playwright/test";

test.describe("Center portal smoke", () => {
  test.skip(true, "Requires center hostname mapping in Playwright host header");

  test("admissions page", async ({ page }) => {
    await page.goto("/admissions");
    await expect(page.getByText("Admissions")).toBeVisible();
  });
});
