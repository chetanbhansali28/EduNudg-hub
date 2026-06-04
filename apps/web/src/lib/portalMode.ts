import type { TenantContext } from "@edunudg/tenant";

export type PortalMode = "platform" | "brand" | "center";

export function getPortalMode(tenant: TenantContext): PortalMode {
  if (tenant.portalType === "platform") return "platform";
  if (tenant.portalType === "center" || tenant.centerSlug) return "center";
  if (tenant.portalType === "brand") return "brand";
  return "platform";
}
