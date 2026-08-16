import type { HomepageFounderProfile, HomepageTrustMedia, HomepageRichFooter } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  trust: HomepageTrustMedia;
  rich?: HomepageRichFooter;
  /** @deprecated Prefer trust.imageUrl — kept as fallback for older configs. */
  highlightFounder?: HomepageFounderProfile | null;
};

function JourneyRowIcon() {
  return (
    <span className="sa-journey__row-icon" aria-hidden>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path
          d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </span>
  );
}

export function buildJourneyHighlight(trust: HomepageTrustMedia, rich?: HomepageRichFooter): {
  label: string;
  primary: string;
  secondary: string;
  caption: string;
} {
  const franchise = rich?.brandStats?.franchiseCount?.trim();
  const students = rich?.brandStats?.studentCount?.trim();

  return {
    label: trust.highlightLabel?.trim() || "Our Investment Fund Raised",
    primary: trust.highlightPrimary?.trim() || students || "20M+",
    secondary: trust.highlightSecondary?.trim() || franchise || "300+",
    caption: trust.highlightCaption?.trim() || "Top mentors around the globe",
  };
}

export function resolveJourneyImageUrl(
  trust: HomepageTrustMedia,
  highlightFounder?: HomepageFounderProfile | null
): string {
  return trust.imageUrl?.trim() || highlightFounder?.photoUrl?.trim() || "";
}

export function JourneySection({
  trust,
  rich,
  highlightFounder,
}: Props) {
  const cards = trust.cards.slice(0, 3);
  const photoUrl = resolveJourneyImageUrl(trust, highlightFounder);
  const heroStats = buildJourneyHighlight(trust, rich);
  const badge = trust.eyebrow?.trim() || "Our Success";
  const heading = [trust.title, trust.titleHighlight].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  return (
    <section className="sa-journey sa-reveal" id="journey">
      <div className="sa-journey__header sa-reveal-item">
        <span className="sa-journey__badge">{badge}</span>
        <h2 className="sa-section-title sa-journey__title">{heading || "Our Journey to Excellence"}</h2>
        {trust.intro ? <p className="sa-journey__intro">{trust.intro}</p> : null}
      </div>

      <div className="sa-journey__grid">
        <article className="sa-journey__list-card">
          {cards.map((card, i) => (
            <div
              key={`${card.title}-${i}`}
              className={`sa-journey__row sa-reveal-item${i < cards.length - 1 ? " sa-journey__row--divider" : ""}`}
            >
              <JourneyRowIcon />
              <div>
                <h3 className="sa-item-title">{card.title}</h3>
                <p>{card.subtitle}</p>
              </div>
            </div>
          ))}
        </article>

        <article className="sa-journey__highlight-card sa-reveal-item">
          <div className="sa-journey__highlight-copy">
            <p className="sa-journey__highlight-label">{heroStats.label}</p>
            <strong className="sa-journey__highlight-primary">{heroStats.primary}</strong>
            <strong className="sa-journey__highlight-secondary">{heroStats.secondary}</strong>
            <span className="sa-journey__highlight-caption">{heroStats.caption}</span>
          </div>
          {photoUrl ? (
            <div className="sa-journey__highlight-photo">
              <MarketingBackgroundMedia src={photoUrl} />
            </div>
          ) : (
            <div className="sa-journey__highlight-photo sa-journey__highlight-photo--placeholder" aria-hidden />
          )}
        </article>
      </div>
    </section>
  );
}
