import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "@/lib/brandLandingBundle";
import { marketingPageClassName, themeUsesLeadModals } from "@/lib/marketingThemeLayout";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import {
  AbacusClassicNav,
  AbacusClassicFooter,
  LeadModalProvider,
  MarketingLeadModals,
} from "@/features/marketing/abacus-classic";
import {
  SparkAcademyNav,
  SparkAcademyFooter,
} from "@/features/marketing/spark-academy";
import "@/features/marketing/marketing.css";
import "@/features/marketing/spark-academy/spark-academy.css";

type Props = {
  showFooter?: boolean;
};

export function BrandPublicLayout({ showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingBundle(brandSlug),
    select: normalizeBrandLandingBundle,
  });

  const theme = bundle?.marketingTheme ?? "novu";
  const isAbacusClassic = theme === "abacus-classic";
  const isSparkAcademy = theme === "spark-academy";

  useEffect(() => {
    if (bundle?.config) {
      document.documentElement.style.setProperty("--novu-yellow", bundle.config.theme.yellowGlow);
      document.documentElement.style.setProperty("--novu-radius-section", bundle.config.theme.radiusSection);
    }
  }, [bundle?.config]);

  if (isLoading || !isBrandLandingBundleReady(bundle)) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const layoutInner = (
    <div className={marketingPageClassName(theme)}>
      {isAbacusClassic ? (
        <AbacusClassicNav config={bundle.config} />
      ) : isSparkAcademy ? (
        <SparkAcademyNav config={bundle.config} />
      ) : (
        <MarketingNav config={bundle.config} />
      )}
      <Outlet
        context={{
          config: bundle.config,
          brandSlug,
          marketingTheme: bundle.marketingTheme,
          publicCurriculum: bundle.publicCurriculum,
          publicStats: bundle.publicStats,
        }}
      />
      {showFooter && !isAbacusClassic && !isSparkAcademy ? <FooterSection config={bundle.config} /> : null}
      {showFooter && isAbacusClassic ? (
        <AbacusClassicFooter config={bundle.config} publicStats={bundle.publicStats} />
      ) : null}
      {showFooter && isSparkAcademy ? (
        <SparkAcademyFooter config={bundle.config} />
      ) : null}
      {themeUsesLeadModals(theme) ? <MarketingLeadModals brandSlug={brandSlug} /> : null}
    </div>
  );

  if (themeUsesLeadModals(theme)) {
    return <LeadModalProvider>{layoutInner}</LeadModalProvider>;
  }

  return layoutInner;
}

export type BrandLandingOutletContext = {
  config: import("@/types/homepage").HomepageConfig;
  brandSlug: string;
  marketingTheme: import("@/types/homepage").MarketingTheme;
  publicCurriculum: import("@/lib/brandCurriculumPublic").PublicCurriculumProgram[];
  publicStats: import("@/lib/brandLandingBundle").BrandPublicStats;
};
