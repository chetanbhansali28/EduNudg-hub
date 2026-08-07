import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig, MARKETING_HOMEPAGE_CONFIG_QUERY_KEY } from "@/lib/homepageApi";
import type { MarketingPublicOutletContext } from "./MarketingPublicLayout";
import { EnterprisePlatformContent } from "./enterprise/EnterprisePlatformContent";

export function MarketingHomePage() {
  const marketingOutlet = useOutletContext<MarketingPublicOutletContext | undefined>();
  const inMarketingChrome = marketingOutlet?.marketingChrome === true;

  const { data: config, isLoading } = useQuery({
    queryKey: MARKETING_HOMEPAGE_CONFIG_QUERY_KEY,
    queryFn: fetchHomepageConfig,
    enabled: !inMarketingChrome,
  });

  const resolved = inMarketingChrome ? marketingOutlet?.config : config;

  if ((!inMarketingChrome && isLoading) || !resolved) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return <EnterprisePlatformContent config={resolved} />;
}
