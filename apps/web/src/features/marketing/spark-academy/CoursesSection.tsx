import { useLayoutEffect, useRef, useState } from "react";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { programCardPalette } from "@/lib/marketingFeatureSections";
import {
  SPARK_COURSES_PREVIEW_FALLBACK,
  sparkCoursesHomepagePreviewLimit,
} from "@/lib/sparkCoursesPreview";
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
  index,
  enrollHref,
  enrollLabel,
}: {
  program: PublicCurriculumProgram;
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

  return (
    <article className="sa-course-card sa-reveal-item">
      <div
        className={`sa-course-card__media${imageUrl ? " sa-course-card__media--image" : ""}`}
        style={
          imageUrl
            ? { backgroundImage: `url(${imageUrl})` }
            : { background: `linear-gradient(135deg, ${palette.bg}, #1e3a8a)` }
        }
      >
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
        <div className="sa-course-card__actions">
          <SparkAcademyCta label={enrollLabel} href={enrollHref} variant="outline" className="sa-course-card__btn" />
          <span className="sa-course-card__rating" aria-label="Rated 5 out of 5">
            ★★★★★ <small>({program.levels.length || 1}+)</small>
          </span>
        </div>
      </div>
    </article>
  );
}

function measureCoursesPreviewLimit(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const pad =
    (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
  return sparkCoursesHomepagePreviewLimit(el.clientWidth - pad);
}

export function CoursesSection({
  programs,
  ctaHref,
  title = "Courses designed for success",
  subtitle = "Explore programs built for real outcomes.",
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [previewLimit, setPreviewLimit] = useState(SPARK_COURSES_PREVIEW_FALLBACK);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      setPreviewLimit(measureCoursesPreviewLimit(el));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [programs.length]);

  if (programs.length === 0) return null;

  const overflow = programs.length > previewLimit;
  const visiblePrograms = expanded || !overflow ? programs : programs.slice(0, previewLimit);

  return (
    <section className="sa-courses sa-reveal" id="programs">
      <span id="curriculum" className="ed-marketing-anchor" aria-hidden />
      <div className="sa-section-head sa-section-head--center sa-reveal-item">
        <h2 className="sa-section-title">{title}</h2>
        {subtitle ? <p className="sa-section-subtitle">{subtitle}</p> : null}
      </div>

      <div ref={gridRef} className="sa-courses__grid sa-courses__grid--center">
        {visiblePrograms.map((program, index) => (
          <CourseCard
            key={program.name}
            program={program}
            index={index}
            enrollHref={ctaHref}
            enrollLabel="Enroll now"
          />
        ))}
      </div>

      {overflow && !expanded ? (
        <div className="sa-courses__action sa-reveal-item">
          <button type="button" className="sa-btn sa-btn--dark" onClick={() => setExpanded(true)}>
            View all courses
          </button>
        </div>
      ) : null}
    </section>
  );
}
