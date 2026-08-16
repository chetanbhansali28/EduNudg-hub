import { useEffect } from "react";
import { Navigate, useLocation, useOutletContext } from "react-router-dom";
import { AboutUsPageContent } from "@/features/marketing/AboutUsContent";
import { isAboutPagePublished } from "@/lib/aboutUs";
import { scrollPublicPageToTop } from "@/lib/marketingPublicSite";
import { themeUsesLeadModals } from "@/lib/marketingThemeLayout";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

/** Brand public `/about` — theme-aware About Us page (Novu / Abacus / Spark). */
export function BrandAboutPage() {
  const { config, marketingTheme } = useOutletContext<BrandLandingOutletContext>();
  const { hash } = useLocation();
  const published = isAboutPagePublished(config.about);

  useEffect(() => {
    if (!published) return;
    scrollPublicPageToTop(hash);
  }, [published, hash]);

  if (!published) {
    return <Navigate to="/" replace />;
  }

  return (
    <AboutUsPageContent
      config={config}
      marketingTheme={marketingTheme}
      useLeadModals={themeUsesLeadModals(marketingTheme)}
    />
  );
}
