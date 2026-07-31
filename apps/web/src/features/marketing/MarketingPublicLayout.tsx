import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { isPlatformSectionEnabled } from "@/lib/homepageSections";
import { scrollToMarketingHash } from "@/lib/marketingPublicSite";
import type { HomepageConfig } from "@/types/homepage";
import { EnterpriseNav } from "./enterprise/EnterpriseNav";
import { EnterpriseSiteFooter } from "./enterprise/EnterpriseSiteFooter";
import "./marketing.css";
import "./enterprise/enterprise.css";

export type MarketingPublicOutletContext = {
  config: HomepageConfig;
  /** True when page is wrapped by enterprise marketing nav/footer. */
  marketingChrome: true;
};

type Props = {
  showFooter?: boolean;
};

export function MarketingPublicLayout({ showFooter = true }: Props) {
  const location = useLocation();
  const { data: config, isLoading } = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
  });

  useEffect(() => {
    if (!config) return;
    document.documentElement.style.setProperty("--novu-yellow", config.theme.yellowGlow);
    document.documentElement.style.setProperty("--novu-radius-section", config.theme.radiusSection);
    document.documentElement.style.setProperty(
      "--novu-font-sans",
      `"${config.meta.fontSans}", system-ui, sans-serif`
    );
    document.documentElement.style.setProperty(
      "--novu-font-serif",
      `"${config.meta.fontSerif}", Georgia, serif`
    );
  }, [config]);

  useEffect(() => {
    if (isLoading || !config) return;
    if (location.pathname !== "/") return;
    scrollToMarketingHash(location.hash);
  }, [isLoading, config, location.pathname, location.hash]);

  if (isLoading || !config) {
    return (
      <div className="marketing-page marketing-page--enterprise marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const showSiteFooter = showFooter && isPlatformSectionEnabled(config, "footer");
  const outletContext: MarketingPublicOutletContext = { config, marketingChrome: true };

  return (
    <div className="marketing-page marketing-page--enterprise">
      <EnterpriseNav config={config} />
      <Outlet context={outletContext} />
      {showSiteFooter ? <EnterpriseSiteFooter config={config} /> : null}
    </div>
  );
}
