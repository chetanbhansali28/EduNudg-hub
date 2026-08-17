import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMarketingPublicBundle,
  MARKETING_PUBLIC_BUNDLE_QUERY_KEY,
} from "@/lib/homepageApi";
import { applyMarketingThemeVariables } from "@/lib/applyMarketingFonts";
import { isPlatformSectionEnabled } from "@/lib/homepageSections";
import { scrollToMarketingHash } from "@/lib/marketingPublicSite";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { EnterpriseNav } from "./enterprise/EnterpriseNav";
import { EnterpriseSiteFooter } from "./enterprise/EnterpriseSiteFooter";
import "./marketing.css";
import "./enterprise/enterprise.css";

export type MarketingPublicOutletContext = {
  config: HomepageConfig;
  legalPages: BrandLegalPages;
  /** True when page is wrapped by enterprise marketing nav/footer. */
  marketingChrome: true;
};

type Props = {
  showFooter?: boolean;
};

export function MarketingPublicLayout({ showFooter = true }: Props) {
  const location = useLocation();
  const { data: bundle, isLoading, isError } = useQuery({
    queryKey: MARKETING_PUBLIC_BUNDLE_QUERY_KEY,
    queryFn: fetchMarketingPublicBundle,
  });

  const config = bundle?.config;
  const legalPages = bundle?.legalPages ?? {};

  useEffect(() => {
    if (!config) return;
    applyMarketingThemeVariables(config);
  }, [config]);

  useEffect(() => {
    if (isLoading || !config) return;
    if (location.pathname !== "/") return;
    scrollToMarketingHash(location.hash);
  }, [isLoading, config, location.pathname, location.hash]);

  if (isLoading) {
    return (
      <div className="marketing-page marketing-page--enterprise marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="marketing-page marketing-page--enterprise marketing-page--loading">
        <p>Unable to load marketing site. Please refresh.</p>
      </div>
    );
  }

  const isLoginRoute = location.pathname === "/login";
  const showSiteFooter =
    (showFooter && isPlatformSectionEnabled(config, "footer")) || isLoginRoute;
  const outletContext: MarketingPublicOutletContext = { config, legalPages, marketingChrome: true };

  return (
    <div
      className={`marketing-page marketing-page--enterprise${isLoginRoute ? " marketing-page--login" : ""}`}
    >
      <EnterpriseNav config={config} />
      <Outlet context={outletContext} />
      {showSiteFooter ? <EnterpriseSiteFooter config={config} legalPages={legalPages} /> : null}
    </div>
  );
}
