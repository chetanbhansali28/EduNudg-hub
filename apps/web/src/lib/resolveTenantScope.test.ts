import { describe, expect, it } from "vitest";
import type { TenantContext } from "@edunudg/tenant";
import { mergePortalBrandingScope, needsPortalScopeIds } from "./resolveTenantScope";

const ABACUSWORLD_BRAND_ID = "a0000000-0000-4000-8000-000000000001";
const KORAMANGALA_CENTER_ID = "b0000000-0000-4000-8000-000000000001";

function brandHostTenant(): TenantContext {
  return {
    hostname: "abacusworld.localhost",
    portalType: "brand",
    brandId: null,
    centerId: null,
    brandSlug: "abacusworld",
    centerSlug: null,
  };
}

describe("resolveTenantScope helpers", () => {
  it("needsPortalScopeIds when brand host lacks brand id", () => {
    expect(needsPortalScopeIds(brandHostTenant())).toBe(true);
  });

  it("mergePortalBrandingScope fills brand id from rpc branding", () => {
    const merged = mergePortalBrandingScope(brandHostTenant(), {
      brandId: ABACUSWORLD_BRAND_ID,
      brandSlug: "abacusworld",
      brandName: "Abacus World",
      brandLogoUrl: "https://cdn.example/logo.png",
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    });

    expect(merged.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });

  it("regression_prefers_slug_resolved_brand_id_over_stale_domain_mapping", () => {
    const STALE_DOMAIN_BRAND_ID = "ddbdae88-a273-4300-92aa-c719cacc6bc2";

    const merged = mergePortalBrandingScope(
      {
        hostname: "abacusworld.localhost",
        portalType: "brand",
        brandId: STALE_DOMAIN_BRAND_ID,
        centerId: null,
        brandSlug: "abacusworld",
        centerSlug: null,
      },
      {
        brandId: ABACUSWORLD_BRAND_ID,
        brandSlug: "abacusworld",
        brandName: "Abacus World",
        brandLogoUrl: null,
        centerId: null,
        centerSlug: null,
        centerName: null,
        loginHeadline: null,
        loginSubtext: null,
      }
    );

    expect(merged.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });

  it("regression_mergePortalBrandingScope_fills_center_id_for_center_host", () => {
    const merged = mergePortalBrandingScope(
      {
        hostname: "koramangala.abacusworld.localhost",
        portalType: "center",
        brandId: null,
        centerId: null,
        brandSlug: "abacusworld",
        centerSlug: "koramangala",
      },
      {
        brandId: ABACUSWORLD_BRAND_ID,
        brandSlug: "abacusworld",
        brandName: "Abacus World",
        brandLogoUrl: null,
        centerId: KORAMANGALA_CENTER_ID,
        centerSlug: "koramangala",
        centerName: "Abacus World Koramangala",
        loginHeadline: null,
        loginSubtext: null,
      }
    );

    expect(merged.brandId).toBe(ABACUSWORLD_BRAND_ID);
    expect(merged.centerId).toBe(KORAMANGALA_CENTER_ID);
    expect(needsPortalScopeIds(merged)).toBe(false);
  });
});
