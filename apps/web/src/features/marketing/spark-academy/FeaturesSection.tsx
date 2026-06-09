import type { HomepageFeatureSection } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  sections: HomepageFeatureSection[];
  imageUrl?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

function featureHeading(section: HomepageFeatureSection): string {
  return [section.title, section.titleSerif].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function FeaturesSection({
  sections,
  imageUrl,
  eyebrow = "Our Key Features",
  title = "Powerful Features for Your Learning Journey",
  subtitle = "From personalized recommendations to interactive content, we've got everything you need to succeed.",
}: Props) {
  if (sections.length === 0) return null;

  return (
    <section className="sa-features" id="features">
      <div className="sa-features__panel">
        <div className="sa-features__inner">
          <div className="sa-features__visual">
            <div className="sa-features__yellow-ring" aria-hidden />
            <div className="sa-features__scribble sa-features__scribble--loop" aria-hidden />
            <div className="sa-features__scribble sa-features__scribble--zigzag" aria-hidden />
            <div className="sa-features__dots" aria-hidden />

            {imageUrl ? (
              <div className="sa-features__photo">
                <MarketingBackgroundMedia src={imageUrl} />
              </div>
            ) : (
              <div className="sa-features__photo sa-features__photo--placeholder" aria-hidden />
            )}

            <div className="sa-features__float sa-features__float--stats" aria-hidden>
              <span className="sa-features__float-label">Last month</span>
              <strong>
                <span className="sa-features__float-trend">↗</span> 25.20%
              </strong>
              <span className="sa-features__float-btn">View all →</span>
            </div>

            <div className="sa-features__float sa-features__float--progress" aria-hidden>
              <span className="sa-features__float-label">Learning Progress</span>
              <strong>55%</strong>
              <span className="sa-features__progress-track">
                <span className="sa-features__progress-fill" />
              </span>
            </div>
          </div>

          <div className="sa-features__content">
            <p className="sa-features__eyebrow">{eyebrow}</p>
            <h2 className="sa-features__title">{title}</h2>
            <p className="sa-features__subtitle">{subtitle}</p>
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
                    <h3>{featureHeading(section)}</h3>
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
