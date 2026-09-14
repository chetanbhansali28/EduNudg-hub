import { describe, expect, it } from "vitest";
import { clearPortalBrandingCache, readPortalBrandingCache, resolveLoginBranding, resolveShellProductName, seedPortalBrandingCache } from "./portalBranding";

const empty = {
  brandId: null,
  brandSlug: null,
  brandName: null,
  brandLogoUrl: null,
  centerId: null,
  centerSlug: null,
  centerName: null,
  loginHeadline: null,
  loginSubtext: null,
};

describe("resolveLoginBranding", () => {
  it("returns platform defaults for platform portal", () => {
    const copy = resolveLoginBranding("platform", empty, null, null);
    expect(copy.productName).toBe("EduNudg");
    expect(copy.accountSubtitle).toContain("platform");
  });

  it("regression_brand_portal_uses_brand_name", () => {
    const copy = resolveLoginBranding(
      "brand",
      { ...empty, brandName: "Fundora", brandLogoUrl: "https://cdn/logo.png" },
      "fundora",
      null
    );
    expect(copy.productName).toBe("Fundora");
    expect(copy.logoUrl).toBe("https://cdn/logo.png");
    expect(copy.accountSubtitle).toContain("Fundora");
  });

  it("regression_center_portal_uses_center_name", () => {
    const copy = resolveLoginBranding(
      "center",
      { ...empty, brandName: "Fundora", centerName: "Downtown Center" },
      "fundora",
      "downtown"
    );
    expect(copy.productName).toBe("Downtown Center");
    expect(copy.portalTagline).toBe("by Fundora");
    expect(copy.headline).toContain("Downtown Center");
  });

  it("regression_center_shell_lockup_shows_franchise_by_brand", () => {
    const shell = resolveShellProductName(
      "center",
      {
        ...empty,
        brandName: "Smart Brain",
        brandLogoUrl: "https://cdn/logo.png",
        centerName: "Rathi Educon",
      },
      "smart-brain",
      "rathi-educon"
    );
    expect(shell.productName).toBe("Rathi Educon");
    expect(shell.portalTagline).toBe("by Smart Brain");
    expect(shell.franchiseName).toBe("Rathi Educon");
    expect(shell.logoUrl).toBe("https://cdn/logo.png");
  });

  it("regression_learn_shell_lockup_uses_student_center_name", () => {
    const shell = resolveShellProductName(
      "learn",
      { ...empty, brandName: "Smart Brain", brandLogoUrl: "https://cdn/logo.png" },
      "smart-brain",
      null,
      { franchiseName: "Rathi Educon" }
    );
    expect(shell.productName).toBe("Rathi Educon");
    expect(shell.portalTagline).toBe("by Smart Brain");
    expect(shell.logoUrl).toBe("https://cdn/logo.png");
  });

  it("regression_franchise_lockup_omits_byline_when_names_match", () => {
    const copy = resolveLoginBranding(
      "center",
      { ...empty, brandName: "Smart Brain", centerName: "Smart Brain" },
      "smart-brain",
      "smart-brain"
    );
    expect(copy.productName).toBe("Smart Brain");
    expect(copy.portalTagline).toBeNull();
  });

  it("regression_brand_shell_lockup_omits_franchise_tagline", () => {
    const shell = resolveShellProductName(
      "brand",
      { ...empty, brandName: "Smart Brain Abacus" },
      "smart-brain-abacus",
      null
    );
    expect(shell.productName).toBe("Smart Brain Abacus");
    expect(shell.portalTagline).toBeNull();
  });

  it("regression_clearPortalBrandingCacheDropsStaleLoginCopy", () => {
    seedPortalBrandingCache("smart-brain-abacus", null, {
      ...empty,
      brandName: "Smart Brain Abacus",
      loginHeadline: "Old headline",
    });
    expect(readPortalBrandingCache("smart-brain-abacus", null)?.loginHeadline).toBe("Old headline");
    clearPortalBrandingCache();
    expect(readPortalBrandingCache("smart-brain-abacus", null)).toBeUndefined();
  });
});
