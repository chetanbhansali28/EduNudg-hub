import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingBundle } from "@/lib/centerLandingApi";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import "@/features/marketing/marketing.css";

type Props = {
  showFooter?: boolean;
};

export function CenterPublicLayout({ showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const centerSlug = tenant.centerSlug ?? "center";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingBundle(brandSlug, centerSlug),
  });

  useEffect(() => {
    if (bundle?.config) {
      document.documentElement.style.setProperty("--novu-yellow", bundle.config.theme.yellowGlow);
      document.documentElement.style.setProperty("--novu-radius-section", bundle.config.theme.radiusSection);
    }
  }, [bundle?.config]);

  if (isLoading || !bundle) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="marketing-page">
      <MarketingNav config={bundle.config} />
      <Outlet context={{ config: bundle.config, profile: bundle.profile, brandSlug, centerSlug }} />
      {showFooter && <FooterSection config={bundle.config} />}
    </div>
  );
}
