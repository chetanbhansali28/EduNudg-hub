import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "@/lib/brandLandingBundle";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import "@/features/marketing/marketing.css";

type Props = {
  showFooter?: boolean;
};

export function BrandPublicLayout({ showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingBundle(brandSlug),
    select: normalizeBrandLandingBundle,
  });

  useEffect(() => {
    if (bundle?.config) {
      document.documentElement.style.setProperty("--novu-yellow", bundle.config.theme.yellowGlow);
      document.documentElement.style.setProperty("--novu-radius-section", bundle.config.theme.radiusSection);
    }
  }, [bundle?.config]);

  if (isLoading || !isBrandLandingBundleReady(bundle)) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="marketing-page">
      <MarketingNav config={bundle.config} />
      <Outlet context={{ config: bundle.config, brandSlug }} />
      {showFooter && <FooterSection config={bundle.config} />}
    </div>
  );
}
