import type { TenantContext } from "@edunudg/tenant";

const PORTAL_QUERY_KEYS = ["portal", "brand", "center"] as const;

/** Keep same-origin portal override params after `/login` navigates to `/app` or `/admin`. */
export function preservedPortalSearch(search: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const key of PORTAL_QUERY_KEYS) {
    const value = search.get(key)?.trim();
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

/** Where to send the user after a successful staff email/password sign-in. */
export function postLoginPath(tenant: Pick<TenantContext, "portalType">): string {
  switch (tenant.portalType) {
    case "platform":
      return "/admin";
    case "brand":
      return "/app";
    case "center":
      return "/app";
    case "learn":
    case "parents":
      return "/";
    default:
      return "/login";
  }
}
