import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingBundle } from "@/lib/centerLandingApi";
import { sanitizeCenterPublicNavConfig } from "@/lib/centerPublicNav";
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

export type CenterLandingOutletContext = {
  config: import("@/types/homepage").HomepageConfig;
  profile: import("@/lib/centerLandingApi").CenterPublicProfile;
  brandSlug: string;
  centerSlug: string;
  marketingTheme: import("@/types/homepage").MarketingTheme;
  publicCurriculum: import("@/lib/brandCurriculumPublic").PublicCurriculumProgram[];
  publicStats: import("@/lib/brandLandingBundle").BrandPublicStats;
};

export function CenterPublicLayout({ showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const centerSlug = tenant.centerSlug ?? "center";

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingBundle(brandSlug, centerSlug),
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

  if (isLoading || !bundle) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const publicConfig = sanitizeCenterPublicNavConfig(bundle.config);

  const layoutInner = (
    <div className={marketingPageClassName(theme)}>
      {isAbacusClassic ? (
        <AbacusClassicNav config={publicConfig} brandSlug={brandSlug} />
      ) : isSparkAcademy ? (
        <SparkAcademyNav config={publicConfig} brandSlug={brandSlug} />
      ) : (
        <MarketingNav config={publicConfig} brandSlug={brandSlug} />
      )}
      <Outlet
        context={{
          config: publicConfig,
          profile: bundle.profile,
          brandSlug,
          centerSlug,
          marketingTheme: bundle.marketingTheme,
          publicCurriculum: bundle.publicCurriculum,
          publicStats: bundle.publicStats,
        }}
      />
      {showFooter && !isAbacusClassic && !isSparkAcademy ? <FooterSection config={publicConfig} /> : null}
      {showFooter && isAbacusClassic ? (
        <AbacusClassicFooter config={publicConfig} publicStats={bundle.publicStats} />
      ) : null}
      {showFooter && isSparkAcademy ? (
        <SparkAcademyFooter config={publicConfig} />
      ) : null}
      {themeUsesLeadModals(theme) ? <MarketingLeadModals brandSlug={brandSlug} /> : null}
    </div>
  );

  if (themeUsesLeadModals(theme)) {
    return <LeadModalProvider>{layoutInner}</LeadModalProvider>;
  }

  return layoutInner;
}
