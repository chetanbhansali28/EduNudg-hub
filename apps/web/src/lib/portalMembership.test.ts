import { describe, expect, it } from "vitest";
import type { TenantContext } from "@edunudg/tenant";
import { hasPortalMembership } from "./portalMembership";
import type { Membership } from "@/hooks/useMembership";

function tenant(partial: Partial<TenantContext> & Pick<TenantContext, "portalType">): TenantContext {
  return {
    hostname: "localhost",
    brandSlug: null,
    centerSlug: null,
    brandId: null,
    centerId: null,
    ...partial,
  };
}

const brandMembership: Membership = {
  id: "1",
  role_key: "brand_owner",
  scope_type: "brand",
  brand_id: "brand-1",
  center_id: null,
};

const centerMembership: Membership = {
  id: "2",
  role_key: "center_staff",
  scope_type: "center",
  brand_id: "brand-1",
  center_id: "center-1",
};

describe("hasPortalMembership", () => {
  it("allows brand user on brand host", () => {
    expect(
      hasPortalMembership(
        [brandMembership],
        tenant({ portalType: "brand", brandId: "brand-1", brandSlug: "abacus", hostname: "abacus.localhost" })
      )
    ).toBe(true);
  });

  it("regression_rejects_brand_user_without_matching_brand_id", () => {
    expect(
      hasPortalMembership(
        [brandMembership],
        tenant({ portalType: "brand", brandId: "other-brand", brandSlug: "other", hostname: "other.localhost" })
      )
    ).toBe(false);
  });

  it("allows center staff on center host", () => {
    expect(
      hasPortalMembership(
        [centerMembership],
        tenant({
          portalType: "center",
          brandId: "brand-1",
          brandSlug: "abacus",
          centerId: "center-1",
          centerSlug: "koramangala",
          hostname: "koramangala.abacus.localhost",
        })
      )
    ).toBe(true);
  });

  it("regression_allows_learn_portal_without_staff_membership", () => {
    expect(
      hasPortalMembership(
        undefined,
        tenant({ portalType: "learn", brandSlug: "abacusworld", hostname: "learn.abacusworld.localhost" })
      )
    ).toBe(true);
    expect(
      hasPortalMembership(
        [],
        tenant({ portalType: "learn", brandSlug: "abacusworld", hostname: "learn.abacusworld.localhost" })
      )
    ).toBe(true);
  });
});
