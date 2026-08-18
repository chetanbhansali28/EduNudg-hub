import type { HomepageTrustMedia } from "@/types/homepage";
import type { BrandPublicStats } from "@/lib/brandLandingBundle";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";
import { EduLearnMark } from "./EduLearnCta";
import { EduLearnDoodles } from "./EduLearnDoodles";

type Props = {
  trust: HomepageTrustMedia;
  publicStats?: BrandPublicStats;
};

export function EduLearnStats({ trust, publicStats }: Props) {
  const cards = [
    {
      value: publicStats?.centersCount ? `${publicStats.centersCount}+` : trust.cards[0]?.title || "3k",
      label: trust.cards[0]?.subtitle || "School partners",
    },
    {
      value: publicStats?.studentsCount ? `${publicStats.studentsCount}+` : trust.cards[1]?.title || "300+",
      label: trust.cards[1]?.subtitle || "Daily learners",
    },
    {
      value: trust.highlightPrimary || trust.cards[2]?.title || "48+",
      label: trust.cards[2]?.subtitle || trust.highlightCaption || "Programs",
    },
  ].slice(0, 3);

  return (
    <section className="el-stats" id="stats">
      <div className="el-section-head">
        <h2>
          Why choose <EduLearnMark>our services?</EduLearnMark>
        </h2>
      </div>
      <div className="el-stats__inner">
        <div className="el-stats__photo">
          <EduLearnDoodles variant="stats" />
          {trust.imageUrl?.trim() ? <MarketingBackgroundMedia src={trust.imageUrl} /> : null}
        </div>
        <div className="el-stats__cards">
          {cards.map((card, index) => (
            <article key={card.label} className={`el-stat-card el-stat-card--${index + 1}`}>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
