import { describe, expect, it } from "vitest";

/**
 * Smoke-import route modules so Vite/Babel parse errors (e.g. duplicate imports)
 * fail tests before they reach the browser console.
 */
describe("AppRoutes smoke imports", () => {
  it("regression_route_modules_parse_without_error", async () => {
    const modules = await Promise.all([
      import("./AppRoutes"),
      import("@/features/platform/SubscriptionsPage"),
      import("@/features/platform/RevenuePage"),
      import("@/features/platform/SettingsPage"),
      import("@/features/marketing/MarketingPublicLayout"),
      import("@/features/marketing/PlatformPricingSection"),
    ]);

    expect(modules.every((mod) => mod != null)).toBe(true);
  });
});
