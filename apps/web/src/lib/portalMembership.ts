import type { Membership } from "@/hooks/useMembership";
import type { TenantContext } from "@edunudg/tenant";

/** Whether the signed-in user has an active membership for the current portal host. */
export function hasPortalMembership(memberships: Membership[] | undefined, tenant: TenantContext): boolean {
  // Parent/student portals use parent–student links in RPCs, not staff memberships.
  if (tenant.portalType === "learn" || tenant.portalType === "parents") {
    return true;
  }

  if (!memberships?.length) return false;

  if (tenant.portalType === "platform") {
    return memberships.some((m) => m.scope_type === "platform");
  }

  if (tenant.portalType === "brand") {
    if (!tenant.brandId) return false;
    return memberships.some(
      (m) =>
        m.scope_type === "platform" ||
        (m.scope_type === "brand" && m.brand_id === tenant.brandId)
    );
  }

  if (tenant.portalType === "center") {
    if (!tenant.centerId) return false;
    return memberships.some(
      (m) =>
        m.scope_type === "platform" ||
        (m.scope_type === "center" && m.center_id === tenant.centerId) ||
        (m.scope_type === "brand" && tenant.brandId != null && m.brand_id === tenant.brandId)
    );
  }

  return true;
}
