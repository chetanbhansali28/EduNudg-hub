import { useMemo } from "react";
import type { TenantContext } from "@edunudg/tenant";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import type { PortalBranding } from "@/lib/portalBranding";
import {
  isBrandOrCenterPortal,
  mergePortalBrandingScope,
  needsPortalScopeIds,
} from "@/lib/resolveTenantScope";

/** Merge hostname tenant with portal branding; slug-matched branding IDs win over domain mapping. */
export function resolvePortalTenantIds(
  tenant: TenantContext,
  branding?: PortalBranding | null
): TenantContext {
  if (!branding) return tenant;
  return mergePortalBrandingScope(tenant, branding);
}

export function useResolvedPortalTenant() {
  const tenant = useTenant();
  const brandingQuery = usePortalBranding();
  const branding = brandingQuery.data;

  const resolvedTenant = useMemo(
    () => (branding ? mergePortalBrandingScope(tenant, branding) : tenant),
    [tenant, branding]
  );

  const scopeIdsPending =
    isBrandOrCenterPortal(tenant) &&
    Boolean(tenant.brandSlug) &&
    (brandingQuery.isFetching || !brandingQuery.isFetched);

  const legacyIdsPending = needsPortalScopeIds(resolvedTenant) && !brandingQuery.isFetched;

  return { tenant: resolvedTenant, isResolving: scopeIdsPending || legacyIdsPending };
}
