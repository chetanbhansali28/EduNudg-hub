import type { TenantContext } from "@edunudg/tenant";

/** Where to send the user after a successful staff email/password sign-in. */
export function postLoginPath(tenant: Pick<TenantContext, "portalType">): string {
  switch (tenant.portalType) {
    case "platform":
      return "/admin";
    case "brand":
      return "/app";
    case "center":
      return "/app";
    default:
      return "/login";
  }
}
