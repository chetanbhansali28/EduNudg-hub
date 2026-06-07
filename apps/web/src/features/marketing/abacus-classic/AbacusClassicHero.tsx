import type { HomepageConfig } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";
import { AbacusCtaButton } from "./MarketingLeadModals";

type Props = {
  config: HomepageConfig;
};

export function AbacusClassicHero({ config }: Props) {
  const hero = config.hero;
  const secondaryLabel = hero.secondaryCtaLabel ?? config.nav.secondaryCtaLabel ?? "Apply franchise";
  const secondaryHref = hero.secondaryCtaHref ?? config.nav.secondaryCtaHref ?? "apply";

  return (
    <section className="ac-hero" id="hero">
      <div className="ac-hero__bg">
        {hero.backgroundImageUrl ? <MarketingBackgroundMedia src={hero.backgroundImageUrl} /> : null}
        <div className="ac-hero__overlay" />
      </div>
      <div className="ac-hero__content">
        {hero.badge ? <span className="ac-hero__badge">{hero.badge}</span> : null}
        <h1 className="ac-hero__title">
          {hero.line1} {hero.line1Serif ? <span className="ac-hero__serif">{hero.line1Serif}</span> : null}
          {hero.line2 || hero.line2Serif ? (
            <>
              <br />
              {hero.line2} {hero.line2Serif ? <span className="ac-hero__serif">{hero.line2Serif}</span> : null}
            </>
          ) : null}
        </h1>
        <p className="ac-hero__subtitle">{hero.subtitle}</p>
        <div className="ac-hero__actions">
          <AbacusCtaButton label={hero.ctaLabel || config.nav.ctaLabel} href={hero.ctaHref || config.nav.ctaHref} variant="primary" />
          <AbacusCtaButton label={secondaryLabel} href={secondaryHref} variant="secondary" />
        </div>
      </div>
    </section>
  );
}
