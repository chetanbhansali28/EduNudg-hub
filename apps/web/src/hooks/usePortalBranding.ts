import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchPortalBranding, type PortalBranding } from "@/lib/portalBranding";

const EMPTY_BRANDING: PortalBranding = {
  brandId: null,
  brandSlug: null,
  brandName: null,
  brandLogoUrl: null,
  centerId: null,
  centerSlug: null,
  centerName: null,
  loginHeadline: null,
  loginSubtext: null,
};

export function usePortalBranding() {
  const tenant = useTenant();

  return useQuery({
    queryKey: ["portal-branding", tenant.brandSlug, tenant.centerSlug],
    queryFn: () => fetchPortalBranding(tenant.brandSlug, tenant.centerSlug),
    staleTime: 5 * 60_000,
    enabled: tenant.portalType !== "platform" && Boolean(tenant.brandSlug),
    placeholderData: EMPTY_BRANDING,
  });
}
