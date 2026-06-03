import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { FooterSection } from "./FooterSection";
import { MarketingNav } from "./MarketingNav";
import "./marketing.css";

type Props = {
  showFooter?: boolean;
};

export function MarketingPublicLayout({ showFooter = true }: Props) {
  const { data: config, isLoading } = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
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
      <MarketingNav config={config} />
      <Outlet context={{ config }} />
      {showFooter && <FooterSection config={config} />}
    </div>
  );
}
