import { describe, expect, it } from "vitest";
import type { TenantContext } from "@edunudg/tenant";
import { resolvePortalTenantIds } from "./useResolvedPortalTenant";
import type { PortalBranding } from "@/lib/portalBranding";

/** IDs from supabase/seed/test-users.sql */
const ABACUSWORLD_BRAND_ID = "a0000000-0000-4000-8000-000000000001";
const KORAMANGALA_CENTER_ID = "b0000000-0000-4000-8000-000000000001";
const STALE_DOMAIN_BRAND_ID = "ddbdae88-a273-4300-92aa-c719cacc6bc2";

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

function abacusBranding(partial?: Partial<PortalBranding>): PortalBranding {
  return {
    brandId: ABACUSWORLD_BRAND_ID,
    brandSlug: "abacusworld",
    brandName: "Abacus World",
    brandLogoUrl: null,
    centerId: null,
    centerSlug: null,
    centerName: null,
    loginHeadline: null,
    loginSubtext: null,
    ...partial,
  };
}

describe("resolvePortalTenantIds", () => {
  it("regression_resolves_brand_id_from_portal_branding_when_domain_mapping_missing", () => {
    const resolved = resolvePortalTenantIds(brandHostTenant(), abacusBranding());
    expect(resolved.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });

  it("regression_prefers_slug_resolved_brand_id_over_stale_domain_mapping", () => {
    const resolved = resolvePortalTenantIds(
      { ...brandHostTenant(), brandId: STALE_DOMAIN_BRAND_ID },
      abacusBranding()
    );

    expect(resolved.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });

  it("resolves center id for center host", () => {
    const resolved = resolvePortalTenantIds(
      {
        hostname: "koramangala.abacusworld.localhost",
        portalType: "center",
        brandId: null,
        centerId: null,
        brandSlug: "abacusworld",
        centerSlug: "koramangala",
      },
      abacusBranding({
        centerId: KORAMANGALA_CENTER_ID,
        centerSlug: "koramangala",
        centerName: "Abacus World Koramangala",
      })
    );

    expect(resolved.brandId).toBe(ABACUSWORLD_BRAND_ID);
    expect(resolved.centerId).toBe(KORAMANGALA_CENTER_ID);
  });
});
