import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { AppleIcon } from "./AppleIcon";
import { FeatureScrollSection } from "./FeatureScrollSection";
import { FranchiseSignupSection } from "./FranchiseSignupSection";
import { ParentEnrollmentSignupSection } from "./ParentEnrollmentSignupSection";
import { HighlightsScroller } from "./HighlightsScroller";
import { PrivacySection } from "./PrivacySection";
import { TestimonialsCarousel } from "./TestimonialsCarousel";
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
  brandSlug?: string | null;
  centerSlug?: string | null;
};

export function MarketingContent({ config, brandSlug, centerSlug }: Props) {
  useScrollReveal(true);

  return (
    <div className="novu-hero-wrap">
      <section data-nav-theme="hero" className="novu-hero">
        <div className="novu-hero__bg">
          <img src={config.hero.backgroundImageUrl} alt="" />
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
          <Link to={config.hero.ctaHref} className="novu-hero__cta group">
            <AppleIcon />
            {config.hero.ctaLabel}
          </Link>
        </div>
      </section>

      <main data-nav-theme="light" className="novu-main">
        <FeatureScrollSection
          sections={config.featureSections}
          phoneFrameUrl={config.hero.phoneFrameUrl}
        />

        <HighlightsScroller cards={config.showcaseCards} />

        <PrivacySection privacy={config.privacy} />

        <TestimonialsCarousel testimonials={config.testimonials} />

        {brandSlug && centerSlug && (
          <ParentEnrollmentSignupSection brandSlug={brandSlug} centerSlug={centerSlug} />
        )}
        {brandSlug && !centerSlug && <FranchiseSignupSection brandSlug={brandSlug} />}

        <section id="faq" data-nav-theme="light" className="novu-faq">
          <h2 className="novu-reveal">Got questions?</h2>
          <FaqList items={config.faq} />
        </section>
      </main>
    </div>
  );
}
