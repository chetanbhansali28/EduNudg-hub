import { Navigate, useOutletContext } from "react-router-dom";
import { AboutUsPageContent } from "@/features/marketing/AboutUsContent";
import { isAboutPagePublished } from "@/lib/aboutUs";
import { themeUsesLeadModals } from "@/lib/marketingThemeLayout";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

/** Brand public `/about` — Mastermind-style About Us page. */
export function BrandAboutPage() {
  const { config, marketingTheme } = useOutletContext<BrandLandingOutletContext>();

  if (!isAboutPagePublished(config.about)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AboutUsPageContent config={config} useLeadModals={themeUsesLeadModals(marketingTheme)} />
  );
}
