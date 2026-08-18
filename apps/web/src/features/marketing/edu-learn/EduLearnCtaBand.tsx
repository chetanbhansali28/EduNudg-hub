import type { HomepageConfig } from "@/types/homepage";
import { EduLearnCta } from "./EduLearnCta";
import { EduLearnDoodles } from "./EduLearnDoodles";

type Props = {
  config: HomepageConfig;
};

export function EduLearnCtaBand({ config }: Props) {
  const band = config.footerCta;
  if (!band?.title?.trim()) return null;
  const photo =
    config.trustMedia?.imageUrl?.trim() ||
    config.hero.backgroundImageUrl?.trim() ||
    config.gallery?.images[0]?.url?.trim() ||
    "";

  return (
    <section className="el-cta" id="contact">
      <div className="el-cta__inner">
        {photo ? (
          <div className="el-cta__photo">
            <img src={photo} alt="" />
          </div>
        ) : null}
        <div className="el-cta__copy">
          <span>{band.ctaLabel || "Get in Touch"}</span>
          <h2>{band.title}</h2>
          {band.subtitle ? <p>{band.subtitle}</p> : null}
        </div>
        <div className="el-cta__action">
          <EduLearnDoodles variant="cta" />
          <EduLearnCta
            label={band.ctaLabel || "Get started"}
            href={band.ctaHref || config.nav.ctaHref}
            className="el-cta__arrow"
            icon
          />
        </div>
      </div>
    </section>
  );
}
