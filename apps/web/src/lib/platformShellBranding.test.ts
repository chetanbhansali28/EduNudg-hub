import { describe, expect, it } from "vitest";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { platformShellFromHomepage } from "./platformShellBranding";

describe("platformShellFromHomepage", () => {
  it("regression_uses_homepage_logo_and_site_name_for_admin_shell", () => {
    const result = platformShellFromHomepage({
      ...DEFAULT_HOMEPAGE_CONFIG,
      meta: {
        ...DEFAULT_HOMEPAGE_CONFIG.meta,
        siteName: "Abacus World HQ",
        logoUrl: "https://cdn.example/platform-logo.png",
      },
    });

    expect(result.productName).toBe("Abacus World HQ");
    expect(result.logoUrl).toBe("https://cdn.example/platform-logo.png");
  });

  it("falls back when homepage config is missing", () => {
    expect(platformShellFromHomepage(undefined)).toEqual({
      productName: "EduNudg",
      logoUrl: null,
    });
  });
});
