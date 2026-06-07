import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { programCardPalette } from "@/lib/marketingFeatureSections";

type Props = {
  title?: string;
  programs: PublicCurriculumProgram[];
};

export function ProgramsMarqueeSection({ title = "Explore Our Core Learning Programs", programs }: Props) {
  if (programs.length === 0) return null;

  const cards = programs.map((program, index) => ({
    program,
    palette: programCardPalette(index),
  }));
  const loop = [...cards, ...cards];

  return (
    <section className="ac-programs" id="programs">
      <div className="ac-programs__inner">
        <h2 className="ac-programs__title">{title}</h2>
        <div className="ac-programs__marquee-wrap">
          <div className="ac-programs__marquee">
            {loop.map(({ program, palette }, i) => (
              <article
                key={`${program.name}-${i}`}
                className="ac-programs__card"
                style={{ backgroundColor: palette.bg }}
              >
                <span className="ac-programs__icon" aria-hidden>
                  {palette.icon}
                </span>
                <h3>{program.name}</h3>
                {program.description ? <p>{program.description}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
