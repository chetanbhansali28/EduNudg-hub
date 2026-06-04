import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { MarketingContent } from "./MarketingContent";

export function MarketingHomePage() {
  const { data: config, isLoading } = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
  });

  if (isLoading || !config) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }

  return <MarketingContent config={config} portalMode="platform" />;
}
