import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingConfig } from "@/lib/centerLandingApi";
import { MarketingContent } from "@/features/marketing/MarketingContent";

export function CenterLandingPage() {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const centerSlug = tenant.centerSlug ?? "center";

  const { data: config, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingConfig(brandSlug, centerSlug),
  });

  if (isLoading || !config) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return (
    <MarketingContent config={config} portalMode="center" brandSlug={brandSlug} centerSlug={centerSlug} />
  );
}
