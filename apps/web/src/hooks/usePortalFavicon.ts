import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { fetchHomepageConfig } from "@/lib/homepageApi";
const DEFAULT_FAVICON = "/favicon.svg";
const ICON_SELECTOR = 'link[rel="icon"], link[rel="shortcut icon"]';

function inferIconType(url: string): string | undefined {
  const path = url.split("?")[0]?.split("#")[0] ?? url;
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".gif")) return "image/gif";
  return undefined;
}

function applyFavicon(href: string) {
  let links = Array.from(document.querySelectorAll<HTMLLinkElement>(ICON_SELECTOR));
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
    links = [link];
  }

  const type = inferIconType(href);
  for (const link of links) {
    link.href = href;
    if (type) link.type = type;
    else link.removeAttribute("type");
  }
}

/** Sets document favicon from platform/brand logos; falls back to app default. */
export function usePortalFavicon() {
  const tenant = useTenant();
  const { data: branding } = usePortalBranding();
  const homepageQuery = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
    enabled: tenant.portalType === "platform",
    staleTime: 5 * 60_000,
  });

  const brandLogoUrl = branding?.brandLogoUrl?.trim() || null;
  const platformLogoUrl = homepageQuery.data?.meta?.logoUrl?.trim() || null;

  const href =
    tenant.portalType === "platform" && platformLogoUrl
      ? platformLogoUrl
      : tenant.portalType !== "platform" && brandLogoUrl
        ? brandLogoUrl
        : DEFAULT_FAVICON;

  useEffect(() => {
    applyFavicon(href);
  }, [href]);
}
