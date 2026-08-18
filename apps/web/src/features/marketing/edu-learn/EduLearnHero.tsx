import type { HomepageConfig } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";
import { visiblePublicFounders } from "@/lib/centerLandingDefaults";
import { EduLearnCta, EduLearnMark } from "./EduLearnCta";
import { EduLearnDoodles } from "./EduLearnDoodles";

type Props = {
  config: HomepageConfig;
  showFranchiseCta?: boolean;
};

export function EduLearnHero({ config, showFranchiseCta = true }: Props) {
  const hero = config.hero;
  const heroImage = hero.backgroundImageUrl?.trim() || hero.phoneFrameUrl?.trim() || "";
  const accentImage = hero.phoneFrameUrl?.trim() && hero.phoneFrameUrl !== heroImage ? hero.phoneFrameUrl : "";
  const founder = visiblePublicFounders(config.founders)[0];
  const highlight = hero.line1Serif?.trim() || "Learning";

  return (
    <section className="el-hero" id="hero">
      <div className="el-hero__inner">
        <div className="el-hero__copy">
          <h1 className="el-hero__title">
            {hero.line1} <EduLearnMark>{highlight}</EduLearnMark>
            {hero.line2 ? (
              <>
                <br />
                {hero.line2}
              </>
            ) : null}
          </h1>
          <p className="el-hero__subtitle">{hero.subtitle}</p>
          <div className="el-hero__actions">
            <EduLearnCta label={hero.ctaLabel || config.nav.ctaLabel} href={hero.ctaHref || config.nav.ctaHref} />
            {showFranchiseCta && (hero.secondaryCtaLabel?.trim() || config.nav.secondaryCtaLabel?.trim()) ? (
              <EduLearnCta
                label={hero.secondaryCtaLabel?.trim() || config.nav.secondaryCtaLabel}
                href={hero.secondaryCtaHref?.trim() || config.nav.secondaryCtaHref || "apply"}
                variant="outline"
              />
            ) : null}
          </div>
        </div>
        <div className="el-hero__visual">
          <div className="el-hero__blob">
            <EduLearnDoodles variant="hero" />
            {heroImage ? <MarketingBackgroundMedia src={heroImage} className="el-hero__photo" /> : null}
          </div>
          {founder ? (
            <div className="el-hero__float">
              {founder.photoUrl ? <img src={founder.photoUrl} alt="" /> : null}
              <div>
                <strong>Best certified teachers worldwide</strong>
                <span>{founder.statBadge?.value || "210+"}</span>
              </div>
            </div>
          ) : null}
          {accentImage ? (
            <div className="el-hero__accent">
              <MarketingBackgroundMedia src={accentImage} />
              <p>Transforming schools and learning centers.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
