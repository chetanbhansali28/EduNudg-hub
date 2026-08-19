import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "@/lib/brandLandingBundle";
import { applyMarketingThemeVariables } from "@/lib/applyMarketingFonts";
import { scrollToMarketingHash } from "@/lib/marketingPublicSite";
import { marketingPageClassName, themeUsesLeadModals } from "@/lib/marketingThemeLayout";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import {
  AbacusClassicNav,
  AbacusClassicFooter,
  LeadModalProvider,
  MarketingLeadModals,
  LeadModalHashOpener,
} from "@/features/marketing/abacus-classic";
import {
  SparkAcademyNav,
  SparkAcademyFooter,
} from "@/features/marketing/spark-academy";
import {
  EduLearnNav,
  EduLearnFooter,
} from "@/features/marketing/edu-learn";
import "@/features/marketing/marketing.css";
import "@/features/marketing/spark-academy/spark-academy.css";
import "@/features/marketing/edu-learn/edu-learn.css";

type Props = {
  showFooter?: boolean;
};

export function BrandPublicLayout({ showFooter = true }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug ?? "brand";
  const location = useLocation();

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["brand-landing", brandSlug],
    queryFn: () => fetchBrandLandingBundle(brandSlug),
    select: normalizeBrandLandingBundle,
  });

  const theme = bundle?.marketingTheme ?? "novu";
  const isAbacusClassic = theme === "abacus-classic";
  const isSparkAcademy = theme === "spark-academy";
  const isEduLearn = theme === "edu-learn";

  useEffect(() => {
    if (bundle?.config) {
      applyMarketingThemeVariables(bundle.config);
    }
  }, [bundle?.config]);

  useEffect(() => {
    if (isLoading || !isBrandLandingBundleReady(bundle)) return;
    if (location.pathname === "/login") return;
    scrollToMarketingHash(location.hash);
  }, [isLoading, bundle, location.hash, location.pathname]);

  if (isLoading || !isBrandLandingBundleReady(bundle)) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const isLoginRoute = location.pathname === "/login";
  const layoutInner = (
    <div className={`${marketingPageClassName(theme)}${isLoginRoute ? " marketing-page--login" : ""}`}>
      {isAbacusClassic ? (
        <AbacusClassicNav config={bundle.config} />
      ) : isSparkAcademy ? (
        <SparkAcademyNav config={bundle.config} />
      ) : isEduLearn ? (
        <EduLearnNav config={bundle.config} />
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
          legalPages: bundle.legalPages,
          socialConnect: bundle.socialConnect,
          marketingChrome: true as const,
        }}
      />
      {showFooter && !isAbacusClassic && !isSparkAcademy && !isEduLearn ? (
        <FooterSection config={bundle.config} legalPages={bundle.legalPages} socialConnect={bundle.socialConnect} />
      ) : null}
      {showFooter && isAbacusClassic ? (
        <AbacusClassicFooter config={bundle.config} legalPages={bundle.legalPages} socialConnect={bundle.socialConnect} />
      ) : null}
      {showFooter && isSparkAcademy ? (
        <SparkAcademyFooter config={bundle.config} legalPages={bundle.legalPages} socialConnect={bundle.socialConnect} />
      ) : null}
      {showFooter && isEduLearn ? (
        <EduLearnFooter config={bundle.config} legalPages={bundle.legalPages} socialConnect={bundle.socialConnect} />
      ) : null}
      {themeUsesLeadModals(theme) && !isLoginRoute ? (
        <MarketingLeadModals brandSlug={brandSlug} theme={theme} />
      ) : null}
    </div>
  );

  if (themeUsesLeadModals(theme)) {
    return (
      <LeadModalProvider>
        {!isLoginRoute ? <LeadModalHashOpener /> : null}
        {layoutInner}
      </LeadModalProvider>
    );
  }

  return layoutInner;
}

export type BrandLandingOutletContext = {
  config: import("@/types/homepage").HomepageConfig;
  brandSlug: string;
  marketingTheme: import("@/types/homepage").MarketingTheme;
  publicCurriculum: import("@/lib/brandCurriculumPublic").PublicCurriculumProgram[];
  publicStats: import("@/lib/brandLandingBundle").BrandPublicStats;
  legalPages: import("@/lib/brandLegalPages").BrandLegalPages;
  socialConnect: import("@/lib/brandSocialConnect").BrandSocialConnect;
  /** True when page is wrapped by brand public nav/footer. */
  marketingChrome?: true;
};
