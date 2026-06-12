import type { TenantContext } from "@edunudg/tenant";

/** Admin theme (light/dark toggle) applies outside public marketing home + login shells. */
export function shouldUseAdminThemeProvider(
  tenant: Pick<TenantContext, "portalType">,
  pathname: string
): boolean {
  const isPublicMarketingShell =
    (tenant.portalType === "platform" ||
      tenant.portalType === "brand" ||
      tenant.portalType === "center") &&
    (pathname === "/" || pathname === "/login");
  return !isPublicMarketingShell;
}
