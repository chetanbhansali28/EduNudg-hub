import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "@/lib/brandLandingBundle";
import { MarketingContent } from "@/features/marketing/MarketingContent";

export function BrandLandingPage() {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingBundle(brandSlug),
    select: normalizeBrandLandingBundle,
  });

  if (isLoading || !isBrandLandingBundleReady(bundle)) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return (
    <MarketingContent
      config={bundle.config}
      portalMode="brand"
      brandSlug={brandSlug}
      publicCurriculum={bundle.publicCurriculum}
    />
  );
}
