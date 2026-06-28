import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { isPlatformSectionEnabled } from "@/lib/homepageSections";
import { EnterpriseNav } from "./enterprise/EnterpriseNav";
import { EnterpriseSiteFooter } from "./enterprise/EnterpriseSiteFooter";
import "./marketing.css";
import "./enterprise/enterprise.css";

type Props = {
  showFooter?: boolean;
};

export function MarketingPublicLayout({ showFooter = true }: Props) {
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

  if (isLoading || !config) {
    return (
      <div className="marketing-page marketing-page--enterprise marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const showSiteFooter = showFooter && isPlatformSectionEnabled(config, "footer");

  return (
    <div className="marketing-page marketing-page--enterprise">
      <EnterpriseNav config={config} />
      <Outlet context={{ config }} />
      {showSiteFooter ? <EnterpriseSiteFooter config={config} /> : null}
    </div>
  );
}
