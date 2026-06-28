import type { HomepageConfig } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  config: HomepageConfig;
};

export function EnterpriseHero({ config }: Props) {
  const hero = config.hero;
  const overlay = config.heroOverlayCard;
  const primaryHref = hero.ctaHref ?? config.nav.ctaHref;
  const primaryLabel = hero.ctaLabel ?? config.nav.ctaLabel;
  const secondaryLabel = hero.secondaryCtaLabel ?? config.nav.secondaryCtaLabel ?? "View Ecosystem";
  const secondaryHref = hero.secondaryCtaHref ?? config.nav.secondaryCtaHref ?? "#connectivity";

  return (
    <section className="ent-hero ent-reveal">
      <div className="ent-hero__grid">
        <div className="ent-hero__card">
          {hero.badge ? <p className="ent-hero__badge">{hero.badge}</p> : null}
          <h1 className="ent-hero__title">
            {hero.line1} <span className="serif">{hero.line1Serif}</span>
            <br />
            {hero.line2} <span className="serif">{hero.line2Serif}</span>
          </h1>
          <p className="ent-hero__subtitle">{hero.subtitle}</p>
          <div className="ent-hero__actions">
            <a href={primaryHref} className="ent-btn ent-btn--primary">
              {primaryLabel}
            </a>
            <a href={secondaryHref} className="ent-btn ent-btn--outline">
              {secondaryLabel}
            </a>
          </div>
        </div>

        <div className="ent-hero__visual">
          <MarketingBackgroundMedia src={hero.backgroundImageUrl} />
          {overlay ? (
            <div className="ent-hero__overlay-card">
              <p className="ent-hero__overlay-eyebrow">{overlay.eyebrow}</p>
              <p className="ent-hero__overlay-value">{overlay.value}</p>
              <div className="ent-hero__overlay-bar" aria-hidden>
                <span style={{ width: `${Math.min(100, Math.max(0, overlay.progressPercent))}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
