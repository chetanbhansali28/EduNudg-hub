import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchBrandLandingBundle } from "@/lib/brandLandingApi";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "@/lib/brandLandingBundle";
import { FooterSection } from "@/features/marketing/FooterSection";
import { MarketingNav } from "@/features/marketing/MarketingNav";
import {
  AbacusClassicNav,
  AbacusClassicFooter,
  AbacusClassicContent,
  LeadModalProvider,
  MarketingLeadModals,
} from "@/features/marketing/abacus-classic";
import "@/features/marketing/marketing.css";

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

  const isAbacusClassic = bundle?.marketingTheme === "abacus-classic";

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

  const pageClass = isAbacusClassic ? "marketing-page marketing-page--abacus-classic" : "marketing-page";

  const layoutInner = (
    <div className={pageClass}>
      {isAbacusClassic ? <AbacusClassicNav config={bundle.config} /> : <MarketingNav config={bundle.config} />}
      <Outlet
        context={{
          config: bundle.config,
          brandSlug,
          marketingTheme: bundle.marketingTheme,
          publicCurriculum: bundle.publicCurriculum,
          publicStats: bundle.publicStats,
        }}
      />
      {showFooter && !isAbacusClassic ? <FooterSection config={bundle.config} /> : null}
      {showFooter && isAbacusClassic ? (
        <AbacusClassicFooter config={bundle.config} publicStats={bundle.publicStats} />
      ) : null}
      {isAbacusClassic ? <MarketingLeadModals brandSlug={brandSlug} /> : null}
    </div>
  );

  if (isAbacusClassic) {
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
