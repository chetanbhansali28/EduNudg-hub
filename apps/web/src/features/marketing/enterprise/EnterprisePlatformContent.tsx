import type { HomepageConfig } from "@/types/homepage";
import { isPlatformSectionEnabled } from "@/lib/homepageSections";
import { useScrollReveal } from "../useScrollReveal";
import { PlatformPricingSection } from "../PlatformPricingSection";
import { EnterpriseHero } from "./EnterpriseHero";
import { EnterpriseEcosystemIntro } from "./EnterpriseEcosystemIntro";
import { EnterpriseConnectivityShowcase } from "./EnterpriseConnectivityShowcase";
import { EnterpriseFeatureGrid } from "./EnterpriseFeatureGrid";
import { EnterpriseBrandSignupSection } from "./EnterpriseBrandSignupSection";
import { EnterpriseFaq } from "./EnterpriseFaq";
import { EnterprisePreFooterCta } from "./EnterprisePreFooterCta";

type Props = {
  config: HomepageConfig;
};

export function EnterprisePlatformContent({ config }: Props) {
  useScrollReveal(true, ".ent-reveal");

  const showHero = isPlatformSectionEnabled(config, "hero");
  const showEcosystem = isPlatformSectionEnabled(config, "ecosystemIntro") && config.ecosystemIntro;
  const showConnectivity =
    isPlatformSectionEnabled(config, "connectivityShowcase") && config.connectivityShowcase;
  const showFeatures =
    isPlatformSectionEnabled(config, "featureGrid") && config.featureSections.length > 0;
  const showFaq = isPlatformSectionEnabled(config, "faq") && config.faq.length > 0;
  const showPreFooter = isPlatformSectionEnabled(config, "footerCta");
  const brandSignupCopy = config.brandSignup;

  return (
    <main className="ent-main">
      {showHero ? <EnterpriseHero config={config} /> : null}
      {showEcosystem ? <EnterpriseEcosystemIntro intro={config.ecosystemIntro!} /> : null}
      {showConnectivity ? (
        <EnterpriseConnectivityShowcase
          showcase={config.connectivityShowcase!}
          fallbackCenterImage={config.hero.phoneFrameUrl}
        />
      ) : null}
      {showFeatures ? <EnterpriseFeatureGrid sections={config.featureSections} /> : null}
      {brandSignupCopy ? <EnterpriseBrandSignupSection copy={brandSignupCopy} /> : null}
      <div className="ent-pricing-wrap">
        <PlatformPricingSection ctaHref={config.nav.ctaHref} ctaLabel={config.nav.ctaLabel} />
      </div>
      {showFaq ? <EnterpriseFaq items={config.faq} /> : null}
      {showPreFooter ? <EnterprisePreFooterCta config={config} /> : null}
    </main>
  );
}
