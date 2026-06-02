import { describe, expect, it } from "vitest";
import { resolveLoginBranding } from "./portalBranding";

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
    expect(copy.headline).toContain("Downtown Center");
  });
});
