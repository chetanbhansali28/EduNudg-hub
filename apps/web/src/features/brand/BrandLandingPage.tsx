import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingConfig } from "@/lib/brandLandingApi";
import { MarketingContent } from "@/features/marketing/MarketingContent";

export function BrandLandingPage() {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";

  const { data: config, isLoading } = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingConfig(brandSlug),
  });

  if (isLoading || !config) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return <MarketingContent config={config} portalMode="brand" brandSlug={brandSlug} />;
}
