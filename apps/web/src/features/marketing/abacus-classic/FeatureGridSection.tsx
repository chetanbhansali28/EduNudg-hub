import type { HomepageFeatureSection } from "@/types/homepage";

type Props = {
  siteName: string;
  sections: HomepageFeatureSection[];
};

export function FeatureGridSection({ siteName, sections }: Props) {
  if (sections.length === 0) return null;

  return (
    <section className="ac-features" id="features">
      <div className="ac-features__inner">
        <h2 className="ac-section-heading">Why {siteName}</h2>
        <div className="ac-features__grid">
          {sections.map((section) => (
            <article key={section.id} className="ac-features__card">
              <h3>
                {section.title}{" "}
                {section.titleSerif ? <span className="ac-features__serif">{section.titleSerif}</span> : null}
              </h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
