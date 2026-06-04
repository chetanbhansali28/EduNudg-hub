import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingBundle } from "@/lib/centerLandingApi";
import { MarketingContent } from "@/features/marketing/MarketingContent";

export function CenterLandingPage() {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const centerSlug = tenant.centerSlug ?? "center";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingBundle(brandSlug, centerSlug),
  });

  if (isLoading || !bundle) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return (
    <MarketingContent
      config={bundle.config}
      portalMode="center"
      brandSlug={brandSlug}
      centerSlug={centerSlug}
      centerProfile={bundle.profile}
    />
  );
}
