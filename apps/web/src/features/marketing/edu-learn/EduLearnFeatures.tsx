import type { HomepageFeatureSection } from "@/types/homepage";
import { EduLearnCta, EduLearnMark } from "./EduLearnCta";

const ICONS = [
  <svg key="spiral" viewBox="0 0 32 32" fill="none" aria-hidden className="el-feature-card__icon">
    <path d="M16 6c5.5 0 10 4 10 9s-4.5 9-10 9-8-3.2-8-7 2.7-6 6-6 5 2 5 4.5-1.6 3.5-3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>,
  <svg key="globe" viewBox="0 0 32 32" fill="none" aria-hidden className="el-feature-card__icon">
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M6 16h20M16 6c3 3.5 4.5 7 4.5 10S19 22.5 16 26c-3-3.5-4.5-7-4.5-10S13 9.5 16 6z" stroke="currentColor" strokeWidth="2" />
  </svg>,
  <svg key="target" viewBox="0 0 32 32" fill="none" aria-hidden className="el-feature-card__icon">
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="16" r="1.6" fill="currentColor" />
  </svg>,
];

type Props = {
  sections: HomepageFeatureSection[];
  title?: string;
  ctaHref: string;
};

export function EduLearnFeatures({ sections, title, ctaHref }: Props) {
  const cards = sections.slice(0, 3);
  if (cards.length === 0) return null;

  return (
    <section className="el-section" id="features">
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>
            {title ? (
              title
            ) : (
              <>
                An <EduLearnMark>easier way</EduLearnMark> to grow your center
              </>
            )}
          </h2>
        </div>
        <div className="el-features__grid">
          {cards.map((card, index) => (
            <article key={card.id || card.title} className="el-feature-card">
              {ICONS[index % ICONS.length]}
              <h3>
                {card.title} <span className="el-accent">{card.titleSerif}</span>
              </h3>
              <p>{card.body}</p>
              <EduLearnCta label="Learn more" href={ctaHref} icon />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
