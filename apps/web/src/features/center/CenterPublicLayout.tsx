import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterLandingBundle } from "@/lib/centerLandingApi";
import { centerFooterContactFromProfile } from "@/lib/centerFooterContact";
import { sanitizeCenterPublicNavConfig } from "@/lib/centerPublicNav";
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
  /** Learn `/login` may resolve a franchise slug that the learn host tenant does not carry. */
  centerSlug?: string;
};

export type CenterLandingOutletContext = {
  config: import("@/types/homepage").HomepageConfig;
  profile: import("@/lib/centerLandingApi").CenterPublicProfile;
  brandSlug: string;
  centerSlug: string;
  marketingTheme: import("@/types/homepage").MarketingTheme;
  publicCurriculum: import("@/lib/brandCurriculumPublic").PublicCurriculumProgram[];
  publicStats: import("@/lib/brandLandingBundle").BrandPublicStats;
  legalPages: import("@/lib/brandLegalPages").BrandLegalPages;
  socialConnect: import("@/lib/brandSocialConnect").BrandSocialConnect;
  /** True when page is wrapped by franchise public nav/footer (learn `/login`). */
  marketingChrome?: true;
};

export function CenterPublicLayout({ showFooter = true, centerSlug: centerSlugProp }: Props) {
  const tenant = useTenant();
  const brandSlug = tenant.brandSlug?.trim() ?? "";
  const centerSlug = (centerSlugProp ?? tenant.centerSlug)?.trim() ?? "";
  const location = useLocation();

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["center-landing", brandSlug, centerSlug],
    queryFn: () => fetchCenterLandingBundle(brandSlug, centerSlug),
    enabled: Boolean(brandSlug && centerSlug),
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
    if (isLoading || !bundle) return;
    if (location.pathname === "/login") return;
    scrollToMarketingHash(location.hash);
  }, [isLoading, bundle, location.hash, location.pathname]);

  if (isLoading || !bundle) {
    return (
      <div className="marketing-page marketing-page--loading">
        <p>Loading…</p>
      </div>
    );
  }

  const publicConfig = sanitizeCenterPublicNavConfig(bundle.config);
  const centerContact = centerFooterContactFromProfile(bundle.profile);
  const brandName = bundle.profile.brandName;
  const isLoginRoute = location.pathname === "/login";

  const layoutInner = (
    <div className={`${marketingPageClassName(theme)}${isLoginRoute ? " marketing-page--login" : ""}`}>
      {isAbacusClassic ? (
        <AbacusClassicNav config={publicConfig} brandSlug={brandSlug} brandName={brandName} centerSlug={centerSlug} />
      ) : isSparkAcademy ? (
        <SparkAcademyNav config={publicConfig} brandSlug={brandSlug} brandName={brandName} centerSlug={centerSlug} />
      ) : isEduLearn ? (
        <EduLearnNav config={publicConfig} brandSlug={brandSlug} brandName={brandName} centerSlug={centerSlug} />
      ) : (
        <MarketingNav config={publicConfig} brandSlug={brandSlug} brandName={brandName} centerSlug={centerSlug} />
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
          legalPages: bundle.legalPages,
          socialConnect: bundle.socialConnect,
          ...(isLoginRoute ? { marketingChrome: true as const } : {}),
        }}
      />
      {showFooter && !isAbacusClassic && !isSparkAcademy && !isEduLearn ? (
        <FooterSection
          config={publicConfig}
          legalPages={bundle.legalPages}
          socialConnect={bundle.socialConnect}
          centerContact={centerContact}
        />
      ) : null}
      {showFooter && isAbacusClassic ? (
        <AbacusClassicFooter
          config={publicConfig}
          legalPages={bundle.legalPages}
          socialConnect={bundle.socialConnect}
          centerContact={centerContact}
          brandName={brandName}
        />
      ) : null}
      {showFooter && isSparkAcademy ? (
        <SparkAcademyFooter
          config={publicConfig}
          legalPages={bundle.legalPages}
          socialConnect={bundle.socialConnect}
          centerContact={centerContact}
          brandName={brandName}
        />
      ) : null}
      {showFooter && isEduLearn ? (
        <EduLearnFooter
          config={publicConfig}
          legalPages={bundle.legalPages}
          socialConnect={bundle.socialConnect}
          centerContact={centerContact}
          brandName={brandName}
        />
      ) : null}
      {themeUsesLeadModals(theme) && !isLoginRoute ? (
        <MarketingLeadModals brandSlug={brandSlug} centerSlug={centerSlug} theme={theme} />
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
