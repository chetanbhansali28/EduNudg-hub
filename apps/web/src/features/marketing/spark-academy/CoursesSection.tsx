import { Link } from "react-router-dom";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { publicCoursePath } from "@/lib/publicCourseSlug";
import { programCardPalette } from "@/lib/marketingFeatureSections";
import { programLessonLabel } from "./curriculumHelpers";
import { SparkAcademyCta } from "./SparkAcademyCta";

type Props = {
  programs: PublicCurriculumProgram[];
  ctaHref: string;
  title?: string;
  subtitle?: string;
};

export function CourseCard({
  program,
  catalog,
  index,
  enrollHref,
  enrollLabel,
}: {
  program: PublicCurriculumProgram;
  catalog: PublicCurriculumProgram[];
  index: number;
  enrollHref: string;
  enrollLabel: string;
}) {
  const palette = programCardPalette(index);
  const lessonLabel = programLessonLabel(program);
  const isBestSeller = index === 0;
  const imageUrl = program.marketingImageUrl?.trim() || null;
  const category = program.ageLabel?.trim() || program.name.split(" ")[0] || "Program";
  const blurb = program.description?.trim() || program.whyTake?.trim() || "";
  const detailHref = publicCoursePath(program, catalog);

  return (
    <article className="sa-course-card sa-reveal-item">
      <Link to={detailHref} className="sa-course-card__link">
        <div
          className={`sa-course-card__media${imageUrl ? " sa-course-card__media--image" : ""}`}
          style={
            imageUrl ? undefined : { background: `linear-gradient(135deg, ${palette.bg}, #1e3a8a)` }
          }
        >
          {imageUrl ? <img className="sa-course-card__photo" src={imageUrl} alt="" /> : null}
          {isBestSeller ? <span className="sa-course-card__tag">Best seller</span> : null}
          {!imageUrl ? (
            <span className="sa-course-card__icon" aria-hidden>
              {palette.icon}
            </span>
          ) : null}
        </div>
        <div className="sa-course-card__body">
          <div className="sa-course-card__meta">
            <span>{category}</span>
            <span className="sa-course-card__lessons">⏱ {lessonLabel}</span>
          </div>
          <h3 className="sa-item-title sa-course-card__title">{program.name}</h3>
          {blurb ? <p className="sa-course-card__desc">{blurb}</p> : null}
        </div>
      </Link>
      <div className="sa-course-card__actions">
        <SparkAcademyCta label={enrollLabel} href={enrollHref} variant="outline" className="sa-course-card__btn" />
        <span className="sa-course-card__rating" aria-label="Rated 5 out of 5">
          ★★★★★ <small>({program.levels.length || 1}+)</small>
        </span>
      </div>
    </article>
  );
}

export function CoursesSection({
  programs,
  ctaHref,
  title = "Courses designed for success",
  subtitle = "Explore programs built for real outcomes.",
}: Props) {
  if (programs.length === 0) return null;

  return (
    <section className="sa-courses sa-reveal" id="programs">
      <span id="curriculum" className="ed-marketing-anchor" aria-hidden />
      <div className="sa-section-head sa-section-head--center sa-reveal-item">
        <h2 className="sa-section-title">{title}</h2>
        {subtitle ? <p className="sa-section-subtitle">{subtitle}</p> : null}
      </div>

      <div className="sa-courses__grid sa-courses__grid--center">
        {programs.map((program, index) => (
          <CourseCard
            key={`${program.id ?? program.name}-${index}`}
            program={program}
            catalog={programs}
            index={index}
            enrollHref={ctaHref}
            enrollLabel="Enroll now"
          />
        ))}
      </div>
    </section>
  );
}
