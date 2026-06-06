import type { HomepageConfig } from "@/types/homepage";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { FeatureScrollSection } from "./FeatureScrollSection";
import type { PortalMode } from "@/lib/portalMode";
import type { CenterPublicProfile } from "@/lib/centerLandingApi";
import { BrandStudentApplicationSection } from "./BrandStudentApplicationSection";
import { CenterBlurbSection } from "./CenterBlurbSection";
import { CenterStudentRegistrationSection } from "./CenterStudentRegistrationSection";
import { FranchiseSignupSection } from "./FranchiseSignupSection";
import { PlatformBrandSignupSection } from "@/features/platform/brandSignups/PlatformBrandSignupSection";
import { HighlightsScroller } from "./HighlightsScroller";
import { PlatformPricingSection } from "./PlatformPricingSection";
import { PrivacySection } from "./PrivacySection";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
import { CurriculumPublicSection } from "./CurriculumPublicSection";
import { MarketingBackgroundMedia } from "./MarketingBackgroundMedia";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { isSectionEnabled } from "@/lib/homepageSections";
import { useScrollReveal } from "./useScrollReveal";

function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="novu-faq__list">
      {items.map((item) => (
        <details key={item.question} className="novu-faq__item">
          <summary className="novu-faq__question">
            {item.question}
            <span className="novu-faq__icon" aria-hidden />
          </summary>
          <p className="novu-faq__answer">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

type Props = {
  config: HomepageConfig;
  portalMode: PortalMode;
  brandSlug?: string | null;
  centerSlug?: string | null;
  centerProfile?: CenterPublicProfile | null;
  publicCurriculum?: PublicCurriculumProgram[];
};

export function MarketingContent(props: Props) {
  if (!props.config?.hero) {
    return <p className="marketing-page--loading-inline">Loading…</p>;
  }
  return <MarketingContentView {...props} config={props.config} />;
}

function MarketingContentView({
  config,
  portalMode,
  brandSlug,
  centerSlug,
  centerProfile,
  publicCurriculum = [],
}: Props) {
  useScrollReveal(true);

  const showHero = isSectionEnabled(config, "hero");
  const showFeatures = isSectionEnabled(config, "featureScroll") && config.featureSections.length > 0;
  const showHighlights = isSectionEnabled(config, "highlights") && config.showcaseCards.length > 0;
  const showPrivacy = isSectionEnabled(config, "privacy");
  const showTestimonials = isSectionEnabled(config, "testimonials");
  const showFaq = isSectionEnabled(config, "faq") && config.faq.length > 0;

  return (
    <div className="novu-hero-wrap">
      {showHero ? (
      <section data-nav-theme="hero" className="novu-hero">
        <div className="novu-hero__bg">
          <MarketingBackgroundMedia src={config.hero.backgroundImageUrl} />
          <div className="novu-hero__overlay" />
          <div className="novu-hero__noise" aria-hidden />
        </div>
        <div className="novu-hero__content">
          <h1 className="novu-hero__title">
            <span className="novu-hero__line">
              <span className="novu-hero__line-inner">
                {config.hero.line1} <span className="serif">{config.hero.line1Serif}</span>
              </span>
            </span>
            <span className="novu-hero__line">
              <span className="novu-hero__line-inner">
                {config.hero.line2} <span className="serif">{config.hero.line2Serif}</span>
              </span>
            </span>
          </h1>
          <p className="novu-hero__subtitle">{config.hero.subtitle}</p>
          <MarketingCtaLink
            href={config.nav.ctaHref}
            label={config.nav.ctaLabel}
            variant="on-dark"
            className="novu-hero__cta"
          />
        </div>
      </section>
      ) : null}

      <main data-nav-theme="light" className="novu-main">
        {showFeatures ? (
        <FeatureScrollSection
          sections={config.featureSections}
          phoneFrameUrl={config.hero.phoneFrameUrl}
        />
        ) : null}

        {showHighlights ? <HighlightsScroller cards={config.showcaseCards} /> : null}

        {(portalMode === "brand" || portalMode === "center") && (
          <CurriculumPublicSection programs={publicCurriculum} />
        )}

        {portalMode === "platform" && (
          <PlatformPricingSection ctaHref={config.nav.ctaHref} ctaLabel={config.nav.ctaLabel} />
        )}

        {showPrivacy ? <PrivacySection privacy={config.privacy} /> : null}

        {showTestimonials ? <TestimonialsCarousel testimonials={config.testimonials} /> : null}

        {portalMode === "platform" && <PlatformBrandSignupSection />}
        {portalMode === "brand" && brandSlug && (
          <>
            <FranchiseSignupSection brandSlug={brandSlug} />
            <BrandStudentApplicationSection brandSlug={brandSlug} />
          </>
        )}
        {portalMode === "center" && brandSlug && centerSlug && (
          <>
            {centerProfile && <CenterBlurbSection profile={centerProfile} />}
            <CenterStudentRegistrationSection brandSlug={brandSlug} centerSlug={centerSlug} />
          </>
        )}

        {showFaq ? (
        <section id="faq" data-nav-theme="light" className="novu-faq">
          <h2 className="novu-reveal">Got questions?</h2>
          <FaqList items={config.faq} />
        </section>
        ) : null}
      </main>
    </div>
  );
}
