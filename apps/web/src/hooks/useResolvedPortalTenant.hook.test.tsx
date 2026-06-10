import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { TenantContext } from "@edunudg/tenant";
import type { PortalBranding } from "@/lib/portalBranding";
import { useResolvedPortalTenant } from "./useResolvedPortalTenant";

const ABACUSWORLD_BRAND_ID = "a0000000-0000-4000-8000-000000000001";
const KORAMANGALA_CENTER_ID = "b0000000-0000-4000-8000-000000000001";

const { tenantState, portalBrandingState } = vi.hoisted(() => ({
  tenantState: {
    hostname: "abacusworld.localhost",
    portalType: "brand",
    brandId: null,
    centerId: null,
    brandSlug: "abacusworld",
    centerSlug: null,
  } as TenantContext,
  portalBrandingState: {
    data: {
      brandId: "a0000000-0000-4000-8000-000000000001",
      brandSlug: "abacusworld",
      brandName: "Abacus World",
      brandLogoUrl: null,
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    } as PortalBranding,
    isLoading: false,
    isFetched: true,
    isFetching: false,
  },
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => portalBrandingState,
}));

describe("useResolvedPortalTenant hook", () => {
  beforeEach(() => {
    tenantState.portalType = "brand";
    tenantState.hostname = "abacusworld.localhost";
    tenantState.brandId = null;
    tenantState.centerId = null;
    tenantState.brandSlug = "abacusworld";
    tenantState.centerSlug = null;
    portalBrandingState.isFetched = true;
    portalBrandingState.isFetching = false;
    portalBrandingState.isLoading = false;
  });

  it("regression_isResolving_true_while_brand_branding_unfetched", () => {
    portalBrandingState.isFetched = false;
    portalBrandingState.isFetching = true;

    const { result } = renderHook(() => useResolvedPortalTenant());

    expect(result.current.isResolving).toBe(true);
  });

  it("regression_isResolving_false_after_brand_branding_fetched", () => {
    portalBrandingState.isFetched = false;
    portalBrandingState.isFetching = true;

    const { result, rerender } = renderHook(() => useResolvedPortalTenant());
    expect(result.current.isResolving).toBe(true);

    portalBrandingState.isFetched = true;
    portalBrandingState.isFetching = false;
    rerender();

    expect(result.current.isResolving).toBe(false);
    expect(result.current.tenant.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });

  it("regression_platform_portal_never_waits_on_branding_fetch", () => {
    tenantState.portalType = "platform";
    tenantState.hostname = "localhost";
    tenantState.brandSlug = null;
    tenantState.centerSlug = null;
    portalBrandingState.isFetched = false;
    portalBrandingState.isFetching = true;
    portalBrandingState.data = undefined as unknown as PortalBranding;

    const { result } = renderHook(() => useResolvedPortalTenant());

    expect(result.current.isResolving).toBe(false);
  });

  it("regression_center_portal_waits_until_branding_fetch_completes", () => {
    tenantState.portalType = "center";
    tenantState.hostname = "koramangala.abacusworld.localhost";
    tenantState.brandSlug = "abacusworld";
    tenantState.centerSlug = "koramangala";
    portalBrandingState.data = {
      brandId: ABACUSWORLD_BRAND_ID,
      brandSlug: "abacusworld",
      brandName: "Abacus World",
      brandLogoUrl: null,
      centerId: KORAMANGALA_CENTER_ID,
      centerSlug: "koramangala",
      centerName: "Abacus World Koramangala",
      loginHeadline: null,
      loginSubtext: null,
    };
    portalBrandingState.isFetched = false;
    portalBrandingState.isFetching = true;

    const { result } = renderHook(() => useResolvedPortalTenant());

    expect(result.current.isResolving).toBe(true);
  });

  it("regression_prefers_slug_resolved_brand_id_over_stale_domain_mapping", () => {
    tenantState.brandId = "ddbdae88-a273-4300-92aa-c719cacc6bc2";

    const { result } = renderHook(() => useResolvedPortalTenant());

    expect(result.current.tenant.brandId).toBe(ABACUSWORLD_BRAND_ID);
  });
});
