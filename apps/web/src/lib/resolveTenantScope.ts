import {
  mergeDomainMapping,
  resolveTenantFromHost,
  type DomainMappingRow,
  type TenantContext,
} from "@edunudg/tenant";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parsePortalBrandingRpc,
  seedPortalBrandingCache,
  type PortalBranding,
} from "@/lib/portalBranding";

const inflightTenantScope = new Map<string, Promise<TenantContext>>();

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

  return {
    ...tenant,
    brandId: brandFromSlug ?? tenant.brandId ?? branding.brandId ?? null,
    centerId: centerFromSlug ?? tenant.centerId ?? branding.centerId ?? null,
  };
}

async function resolveTenantScopeOnce(
  supabase: SupabaseClient,
  hostname: string
): Promise<TenantContext> {
  const base = resolveTenantFromHost(hostname);

  try {
    const { data: mapping, error: mappingError } = await supabase
      .from("domain_mappings")
      .select("hostname, portal_type, brand_id, center_id")
      .eq("hostname", base.hostname)
      .maybeSingle();

    let tenant = mappingError
      ? base
      : mergeDomainMapping(base, mapping as DomainMappingRow | null);

    if (!tenant.brandSlug || !isBrandOrCenterPortal(tenant)) return tenant;

    const { data, error } = await supabase.rpc("get_portal_branding", {
      p_brand_slug: tenant.brandSlug,
      p_center_slug: tenant.centerSlug,
    });

    if (error) return tenant;

    const branding = parsePortalBrandingRpc(data);
    seedPortalBrandingCache(tenant.brandSlug, tenant.centerSlug, branding);
    tenant = mergePortalBrandingScope(tenant, branding);

    return tenant;
  } catch {
    return base;
  }
}

/** Resolve hostname tenant: domain mapping for portal type, then slug-based get_portal_branding RPC. */
export async function resolveTenantScope(
  supabase: SupabaseClient,
  hostname: string
): Promise<TenantContext> {
  const inflight = inflightTenantScope.get(hostname);
  if (inflight) return inflight;

  const promise = resolveTenantScopeOnce(supabase, hostname).finally(() => {
    inflightTenantScope.delete(hostname);
  });
  inflightTenantScope.set(hostname, promise);
  return promise;
}
