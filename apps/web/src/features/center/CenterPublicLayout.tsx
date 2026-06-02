import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingConfig } from "@/lib/centerLandingApi";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import type { NavTheme } from "@/features/marketing/useNavTheme";
import "@/features/marketing/marketing.css";

type Props = {
  navTheme?: NavTheme;
  showFooter?: boolean;
};

export function CenterPublicLayout({ navTheme = "hero", showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const centerSlug = tenant.centerSlug ?? "center";

  const { data: config, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingConfig(brandSlug, centerSlug),
  });

  useEffect(() => {
    if (config) {
      document.documentElement.style.setProperty("--novu-yellow", config.theme.yellowGlow);
      document.documentElement.style.setProperty("--novu-radius-section", config.theme.radiusSection);
    }
  }, [config]);

  if (isLoading || !config) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="marketing-page">
      <MarketingNav config={config} theme={navTheme} />
      <Outlet context={{ config, brandSlug, centerSlug }} />
      {showFooter && <FooterSection config={config} />}
    </div>
  );
}
