import { useState } from "react";
import type { HomepageProgramsSection } from "@/types/homepage";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import {
  resolveProgramsGridItems,
  type ProgramsGridDisplayItem,
} from "@/lib/programsGridItems";
import { programCardPalette } from "@/lib/marketingFeatureSections";
import { AcModalShell } from "./MarketingLeadModals";

type Props = {
  programs: PublicCurriculumProgram[];
  programsSection?: HomepageProgramsSection;
};

function itemScholarship(item: ProgramsGridDisplayItem, defaultHighlight?: string): string | null {
  return item.scholarshipHighlight?.trim() || defaultHighlight?.trim() || null;
}

export function ProgramsGridSection({ programs, programsSection }: Props) {
  const [activeItem, setActiveItem] = useState<ProgramsGridDisplayItem | null>(null);
  const items = resolveProgramsGridItems(programsSection, programs);

  if (items.length === 0) return null;

  const eyebrow = programsSection?.eyebrow ?? "WHAT WE TEACH";
  const title = programsSection?.title ?? "World-Class Brain Development";
  const defaultScholarship = programsSection?.defaultScholarshipHighlight;
  const activeScholarship = activeItem ? itemScholarship(activeItem, defaultScholarship) : null;

  return (
    <>
      <section className="ac-programs-grid" id="programs">
        <div className="ac-programs-grid__inner">
          <header className="ac-programs-grid__head">
            {eyebrow ? <p className="ac-programs-grid__eyebrow">{eyebrow}</p> : null}
            <h2 className="ac-programs-grid__title">{title}</h2>
            <span className="ac-programs-grid__accent" aria-hidden />
          </header>

          <div className="ac-programs-grid__cards">
            {items.map((item, index) => {
              const palette = programCardPalette(index);

              return (
                <article key={item.id} className="ac-programs-grid__card">
                  <div
                    className="ac-programs-grid__media"
                    style={
                      item.imageUrl
                        ? { backgroundImage: `url(${item.imageUrl})` }
                        : { background: `linear-gradient(135deg, ${palette.bg}, #1e3a8a)` }
                    }
                  >
                    {!item.imageUrl ? (
                      <span className="ac-programs-grid__media-icon" aria-hidden>
                        {palette.icon}
                      </span>
                    ) : null}
                    {item.ageLabel ? (
                      <span className="ac-programs-grid__badge">{item.ageLabel}</span>
                    ) : null}
                  </div>
                  <div className="ac-programs-grid__body">
                    <h3 className="ac-programs-grid__name">{item.name}</h3>
                    {item.description ? (
                      <p className="ac-programs-grid__desc">{item.description}</p>
                    ) : null}
                    <button
                      type="button"
                      className="ac-programs-grid__know-more"
                      onClick={() => setActiveItem(item)}
                    >
                      Know More →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <AcModalShell
        title={activeItem ? `${activeItem.name} Course Details` : "Course Details"}
        open={activeItem !== null}
        onClose={() => setActiveItem(null)}
      >
        {activeItem ? (
          <div className="ac-program-details">
            {activeItem.intro ? (
              <p className="ac-program-details__intro">{activeItem.intro}</p>
            ) : null}
            {activeItem.benefits.length > 0 ? (
              <div className="ac-program-details__benefits">
                <h3 className="ac-program-details__benefits-title">
                  <span aria-hidden>★</span> Benefits of {activeItem.name}:
                </h3>
                <ul className="ac-program-details__benefits-list">
                  {activeItem.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
            ) : activeItem.description ? (
              <p className="ac-program-details__intro">{activeItem.description}</p>
            ) : null}
            {activeScholarship ? (
              <div className="ac-program-details__scholarship" role="note">
                <span className="ac-program-details__scholarship-icon" aria-hidden>
                  🏆
                </span>
                <strong>{activeScholarship}</strong>
              </div>
            ) : null}
          </div>
        ) : null}
      </AcModalShell>
    </>
  );
}

/** @deprecated Use ProgramsGridSection */
export const ProgramsMarqueeSection = ProgramsGridSection;
