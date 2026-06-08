import {
  mergeDomainMapping,
  resolveTenantFromHost,
  type DomainMappingRow,
  type TenantContext,
} from "@edunudg/tenant";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logPortalDebug } from "@/lib/portalDebug";
import { parsePortalBrandingRpc, type PortalBranding } from "@/lib/portalBranding";

function slugMatches(actual: string | null | undefined, expected: string | null | undefined): boolean {
  if (!actual || !expected) return false;
  return actual.toLowerCase() === expected.toLowerCase();
}

export function isBrandOrCenterPortal(tenant: TenantContext): boolean {
  return tenant.portalType === "brand" || tenant.portalType === "center";
}

export function needsPortalScopeIds(tenant: TenantContext): boolean {
  if (!tenant.brandSlug) return false;
  if (tenant.portalType === "brand") return !tenant.brandId;
  if (tenant.portalType === "center") return !tenant.brandId || !tenant.centerId;
  return false;
}

/**
 * Hostname slug is authoritative for which brand/center the user is on.
 * Prefer slug-resolved IDs from get_portal_branding over stale domain_mappings rows.
 */
export function mergePortalBrandingScope(tenant: TenantContext, branding: PortalBranding): TenantContext {
  const brandFromSlug =
    slugMatches(branding.brandSlug, tenant.brandSlug) && branding.brandId ? branding.brandId : null;

  const centerFromSlug =
    tenant.portalType === "center" &&
    slugMatches(branding.centerSlug, tenant.centerSlug) &&
    branding.centerId
      ? branding.centerId
      : null;

  if (
    import.meta.env.DEV &&
    tenant.brandId &&
    brandFromSlug &&
    tenant.brandId !== brandFromSlug
  ) {
    logPortalDebug("tenant.scope.brand_id_mismatch", {
      hostname: tenant.hostname,
      brandSlug: tenant.brandSlug,
      domainMappingBrandId: tenant.brandId,
      slugResolvedBrandId: brandFromSlug,
      using: "slug_resolved",
    });
  }

  if (
    import.meta.env.DEV &&
    tenant.centerId &&
    centerFromSlug &&
    tenant.centerId !== centerFromSlug
  ) {
    logPortalDebug("tenant.scope.center_id_mismatch", {
      hostname: tenant.hostname,
      centerSlug: tenant.centerSlug,
      domainMappingCenterId: tenant.centerId,
      slugResolvedCenterId: centerFromSlug,
      using: "slug_resolved",
    });
  }

  return {
    ...tenant,
    brandId: brandFromSlug ?? tenant.brandId ?? branding.brandId ?? null,
    centerId: centerFromSlug ?? tenant.centerId ?? branding.centerId ?? null,
  };
}

/** Resolve hostname tenant: domain mapping for portal type, then slug-based get_portal_branding RPC. */
export async function resolveTenantScope(
  supabase: SupabaseClient,
  hostname: string
): Promise<TenantContext> {
  const base = resolveTenantFromHost(hostname);

  const { data: mapping, error: mappingError } = await supabase
    .from("domain_mappings")
    .select("hostname, portal_type, brand_id, center_id")
    .eq("hostname", base.hostname)
    .maybeSingle();

  let tenant = mappingError
    ? base
    : mergeDomainMapping(base, mapping as DomainMappingRow | null);

  if (mappingError) {
    logPortalDebug("tenant.domain_mapping.error", {
      hostname: base.hostname,
      message: mappingError.message,
    });
  } else {
    logPortalDebug("tenant.domain_mapping", {
      hostname: base.hostname,
      portalType: tenant.portalType,
      brandId: tenant.brandId,
      centerId: tenant.centerId,
      brandSlug: tenant.brandSlug,
      centerSlug: tenant.centerSlug,
    });
  }

  if (!tenant.brandSlug || !isBrandOrCenterPortal(tenant)) return tenant;

  const { data, error } = await supabase.rpc("get_portal_branding", {
    p_brand_slug: tenant.brandSlug,
    p_center_slug: tenant.centerSlug,
  });

  if (error) {
    logPortalDebug("tenant.scope.rpc.error", {
      brandSlug: tenant.brandSlug,
      centerSlug: tenant.centerSlug,
      message: error.message,
    });
    return tenant;
  }

  const branding = parsePortalBrandingRpc(data);
  tenant = mergePortalBrandingScope(tenant, branding);

  logPortalDebug("tenant.scope.resolved", {
    hostname: base.hostname,
    portalType: tenant.portalType,
    brandId: tenant.brandId,
    centerId: tenant.centerId,
    brandSlug: tenant.brandSlug,
    centerSlug: tenant.centerSlug,
    brandLogoUrl: branding.brandLogoUrl,
  });

  return tenant;
}
