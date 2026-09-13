import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalFavicon } from "@/hooks/usePortalFavicon";
import { usePublicDocumentHead } from "@/hooks/usePageMeta";
import { fetchMarketingPublicBundle, MARKETING_PUBLIC_BUNDLE_QUERY_KEY } from "@/lib/homepageApi";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { fetchCenterLandingBundle } from "@/lib/centerLandingApi";
import { deriveRequestPublicSeo } from "@/lib/publicSeoRequest";

function portalBaseDomain(): string | undefined {
  const value = import.meta.env.VITE_PORTAL_BASE_DOMAIN?.trim();
  return value || undefined;
}

export function PortalDocumentHead() {
  usePortalFavicon();
  const tenant = useTenant();
  const location = useLocation();
  const brandSlug = tenant.brandSlug ?? "";
  const centerSlug = tenant.centerSlug ?? "";

  const platformBundle = useQuery({
    queryKey: MARKETING_PUBLIC_BUNDLE_QUERY_KEY,
    queryFn: fetchMarketingPublicBundle,
    enabled: tenant.portalType === "platform",
  });
  const brandBundle = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingBundle(brandSlug),
    enabled: tenant.portalType === "brand" && Boolean(brandSlug),
  });
  const centerBundle = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingBundle(brandSlug, centerSlug),
    enabled: tenant.portalType === "center" && Boolean(brandSlug && centerSlug),
  });

  const seo = useMemo(() => {
    const hostname = typeof window !== "undefined" ? window.location.host : tenant.hostname;
    const protocol = typeof window !== "undefined" ? window.location.protocol.replace(":", "") : "https";
    if (tenant.portalType === "platform") {
      return deriveRequestPublicSeo({
        hostname,
        pathname: location.pathname,
        search: location.search,
        protocol,
        portalBaseDomain: portalBaseDomain(),
        config: platformBundle.data?.config ?? null,
        legalPages: platformBundle.data?.legalPages,
      });
    }
    if (tenant.portalType === "brand") {
      return deriveRequestPublicSeo({
        hostname,
        pathname: location.pathname,
        search: location.search,
        protocol,
        portalBaseDomain: portalBaseDomain(),
        config: brandBundle.data?.config ?? null,
        programs: brandBundle.data?.publicCurriculum,
        legalPages: brandBundle.data?.legalPages,
        socialConnect: brandBundle.data?.socialConnect,
        brandName: brandBundle.data?.config.meta.siteName ?? null,
      });
    }
    if (tenant.portalType === "center" && centerBundle.data) {
      const profile = centerBundle.data.profile;
      return deriveRequestPublicSeo({
        hostname,
        pathname: location.pathname,
        search: location.search,
        protocol,
        portalBaseDomain: portalBaseDomain(),
        config: centerBundle.data.config,
        programs: centerBundle.data.publicCurriculum,
        legalPages: centerBundle.data.legalPages,
        socialConnect: centerBundle.data.socialConnect,
        brandName: profile.brandName,
        center: {
          name: profile.displayName?.trim() || profile.centerName,
          city: profile.city,
          addressLine1: profile.addressLine1,
          phone: profile.contactPhone,
          region: profile.region,
          pincode: profile.pincode,
          shortDescription: profile.shortDescription,
        },
      });
    }
    return deriveRequestPublicSeo({
      hostname,
      pathname: location.pathname,
      search: location.search,
      protocol,
      portalBaseDomain: portalBaseDomain(),
    });
  }, [
    tenant.portalType,
    tenant.hostname,
    location.pathname,
    location.search,
    platformBundle.data,
    brandBundle.data,
    centerBundle.data,
  ]);

  usePublicDocumentHead(seo);
  return null;
}
