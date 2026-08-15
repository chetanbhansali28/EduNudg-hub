import { Navigate, useOutletContext } from "react-router-dom";
import { AboutUsPageContent } from "@/features/marketing/AboutUsContent";
import { isAboutPagePublished } from "@/lib/aboutUs";
import { themeUsesLeadModals } from "@/lib/marketingThemeLayout";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

/** Brand public `/about` — theme-aware About Us page (Novu / Abacus / Spark). */
export function BrandAboutPage() {
  const { config, marketingTheme } = useOutletContext<BrandLandingOutletContext>();

  if (!isAboutPagePublished(config.about)) {
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
