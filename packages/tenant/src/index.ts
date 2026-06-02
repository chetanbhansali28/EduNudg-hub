export type PortalType = "platform" | "brand" | "center" | "learn" | "parents";

export interface TenantContext {
  hostname: string;
  portalType: PortalType;
  brandId: string | null;
  centerId: string | null;
  brandSlug: string | null;
  centerSlug: string | null;
}

export interface DomainMappingRow {
  hostname: string;
  portal_type: PortalType;
  brand_id: string | null;
  center_id: string | null;
}

/** Dev fallback when DB has no mapping */
export function resolveTenantFromHost(hostname: string): TenantContext {
  const host = hostname.split(":")[0].toLowerCase();

  if (host === "localhost" || host === "127.0.0.1" || host === "admin.localhost") {
    return {
      hostname: host,
      portalType: "platform",
      brandId: null,
      centerId: null,
      brandSlug: null,
      centerSlug: null,
    };
  }

  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] !== "learn" && parts[0] !== "parents") {
    const [centerSlug, brandSlug] = parts;
    return {
      hostname: host,
      portalType: "center",
      brandId: null,
      centerId: null,
      brandSlug,
      centerSlug,
    };
  }

  if (parts.length >= 2) {
    const brandSlug = parts[0];
    if (brandSlug === "learn") {
      return {
        hostname: host,
        portalType: "learn",
        brandId: null,
        centerId: null,
        brandSlug: parts[1] ?? null,
        centerSlug: null,
      };
    }
    if (brandSlug === "parents") {
      return {
        hostname: host,
        portalType: "parents",
        brandId: null,
        centerId: null,
        brandSlug: parts[1] ?? null,
        centerSlug: null,
      };
    }
    return {
      hostname: host,
      portalType: "brand",
      brandId: null,
      centerId: null,
      brandSlug,
      centerSlug: null,
    };
  }

  return {
    hostname: host,
    portalType: "platform",
    brandId: null,
    centerId: null,
    brandSlug: null,
    centerSlug: null,
  };
}

export function mergeDomainMapping(
  base: TenantContext,
  row: DomainMappingRow | null
): TenantContext {
  if (!row) return base;
  return {
    ...base,
    portalType: row.portal_type,
    brandId: row.brand_id,
    centerId: row.center_id,
  };
}
