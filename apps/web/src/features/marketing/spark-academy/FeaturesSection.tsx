import type { HomepageFeatureSection, HomepageFeaturesShowcase } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  sections: HomepageFeatureSection[];
  showcase?: HomepageFeaturesShowcase | null;
  /** Fallback when showcase.imageUrl is empty (legacy hero/gallery/founder chain). */
  imageUrlFallback?: string;
};

function featureHeading(section: HomepageFeatureSection): string {
  return [section.title, section.titleSerif].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

const SHOWCASE_DEFAULTS = {
  eyebrow: "Our Key Features",
  title: "Powerful Features for Your Learning Journey",
  subtitle:
    "From personalized recommendations to interactive content, we've got everything you need to succeed.",
  floatStatsLabel: "Last month",
  floatStatsValue: "25.20%",
  floatStatsAction: "View all →",
  floatProgressLabel: "Learning Progress",
  floatProgressValue: "55%",
} as const;

export function resolveFeaturesShowcase(
  showcase?: HomepageFeaturesShowcase | null,
  imageUrlFallback?: string
) {
  return {
    eyebrow: showcase?.eyebrow?.trim() || SHOWCASE_DEFAULTS.eyebrow,
    title: showcase?.title?.trim() || SHOWCASE_DEFAULTS.title,
    subtitle: showcase?.subtitle?.trim() || SHOWCASE_DEFAULTS.subtitle,
    imageUrl: showcase?.imageUrl?.trim() || imageUrlFallback?.trim() || "",
    floatStatsLabel: showcase?.floatStatsLabel?.trim() || SHOWCASE_DEFAULTS.floatStatsLabel,
    floatStatsValue: showcase?.floatStatsValue?.trim() || SHOWCASE_DEFAULTS.floatStatsValue,
    floatStatsAction: showcase?.floatStatsAction?.trim() || SHOWCASE_DEFAULTS.floatStatsAction,
    floatProgressLabel: showcase?.floatProgressLabel?.trim() || SHOWCASE_DEFAULTS.floatProgressLabel,
    floatProgressValue: showcase?.floatProgressValue?.trim() || SHOWCASE_DEFAULTS.floatProgressValue,
  };
}

export function FeaturesSection({ sections, showcase, imageUrlFallback }: Props) {
  if (sections.length === 0) return null;

  const resolved = resolveFeaturesShowcase(showcase, imageUrlFallback);

  return (
    <section className="sa-features" id="features">
      <div className="sa-features__panel">
        <div className="sa-features__inner">
          <div className="sa-features__visual">
            <div className="sa-features__yellow-ring" aria-hidden />
            <div className="sa-features__scribble sa-features__scribble--loop" aria-hidden />
            <div className="sa-features__scribble sa-features__scribble--zigzag" aria-hidden />
            <div className="sa-features__dots" aria-hidden />

            <div className="sa-features__photo-stage">
              {resolved.imageUrl ? (
                <div className="sa-features__photo">
                  <MarketingBackgroundMedia src={resolved.imageUrl} />
                </div>
              ) : (
                <div className="sa-features__photo sa-features__photo--placeholder" aria-hidden />
              )}
            </div>

            <div className="sa-features__float sa-features__float--stats">
              <span className="sa-features__float-label">{resolved.floatStatsLabel}</span>
              <strong>
                <span className="sa-features__float-trend" aria-hidden>
                  ↗
                </span>{" "}
                {resolved.floatStatsValue}
              </strong>
              <span className="sa-features__float-btn">{resolved.floatStatsAction}</span>
            </div>

            <div className="sa-features__float sa-features__float--progress">
              <span className="sa-features__float-label">{resolved.floatProgressLabel}</span>
              <strong>{resolved.floatProgressValue}</strong>
              <span className="sa-features__progress-track" aria-hidden>
                <span className="sa-features__progress-fill" />
              </span>
            </div>
          </div>

          <div className="sa-features__content">
            <p className="sa-features__eyebrow">{resolved.eyebrow}</p>
            <h2 className="sa-section-title sa-features__title">{resolved.title}</h2>
            <p className="sa-features__subtitle">{resolved.subtitle}</p>
            <ul className="sa-features__list">
              {sections.map((section, index) => (
                <li
                  key={section.id}
                  className={`sa-features__item${index < sections.length - 1 ? " sa-features__item--divider" : ""}`}
                >
                  <span className="sa-features__check" aria-hidden>
                    <svg viewBox="0 0 12 10" width="12" height="10" fill="none" aria-hidden>
                      <path
                        d="M1 5.2 4.2 8.4 11 1.4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <h3 className="sa-item-title">{featureHeading(section)}</h3>
                    <p>{section.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
