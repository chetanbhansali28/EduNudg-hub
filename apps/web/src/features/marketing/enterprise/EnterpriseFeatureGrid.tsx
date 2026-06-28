import type { HomepageFeatureSection } from "@/types/homepage";
import { EnterpriseIcon } from "./EnterpriseIcon";

type Props = {
  sections: HomepageFeatureSection[];
};

export function EnterpriseFeatureGrid({ sections }: Props) {
  if (sections.length === 0) return null;

  return (
    <section id="features" className="ent-section ent-reveal">
      <div className="ent-section__inner">
        <div className="ent-features__grid">
          {sections.map((section) => (
            <article key={section.id} className="ent-features__card">
              {section.iconKeys && section.iconKeys.length > 0 ? (
                <div className="ent-features__icons">
                  {section.iconKeys.map((key) => (
                    <EnterpriseIcon key={key} iconKey={key} className="ent-icon--tile" />
                  ))}
                </div>
              ) : null}
              <h3>
                {section.title} <span className="serif">{section.titleSerif}</span>
              </h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
