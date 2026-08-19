import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { EduLearnCta, EduLearnMark } from "./EduLearnCta";

type Props = {
  programs: PublicCurriculumProgram[];
  ctaHref: string;
  title?: string;
};

export function EduLearnCourses({ programs, ctaHref, title }: Props) {
  if (programs.length === 0) return null;
  const heading = title?.trim() || "Courses";

  return (
    <section className="el-section" id="programs">
      <span id="curriculum" className="ed-marketing-anchor" aria-hidden />
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>
            {/course/i.test(heading) ? heading : <>{heading} <EduLearnMark>for your center</EduLearnMark></>}
          </h2>
        </div>
        <div className="el-courses__grid">
          {programs.map((program) => (
            <article key={program.name} className="el-course-card">
              {program.marketingImageUrl ? (
                <img className="el-course-card__media" src={program.marketingImageUrl} alt="" />
              ) : (
                <div className="el-course-card__media el-course-card__media--empty" aria-hidden />
              )}
              <div className="el-course-card__body">
                <h3>{program.name}</h3>
                {program.description ? <p>{program.description}</p> : null}
                <EduLearnCta label="Enroll now" href={ctaHref} icon />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
