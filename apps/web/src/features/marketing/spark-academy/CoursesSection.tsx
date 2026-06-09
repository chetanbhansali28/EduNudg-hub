import { useMemo, useState } from "react";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { programCardPalette } from "@/lib/marketingFeatureSections";
import { programLessonLabel } from "./curriculumHelpers";
import { SparkAcademyCta } from "./SparkAcademyCta";

type Props = {
  programs: PublicCurriculumProgram[];
  ctaHref: string;
  ctaLabel: string;
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

  return (
    <article className="sa-course-card">
      <div className="sa-course-card__media" style={{ background: `linear-gradient(135deg, ${palette.bg}, #1e3a8a)` }}>
        {isBestSeller ? <span className="sa-course-card__tag">Best seller</span> : null}
        <span className="sa-course-card__icon" aria-hidden>
          {palette.icon}
        </span>
      </div>
      <div className="sa-course-card__body">
        <div className="sa-course-card__meta">
          <span>{program.name.split(" ")[0] ?? "Program"}</span>
          <span className="sa-course-card__lessons">⏱ {lessonLabel}</span>
        </div>
        <h3 className="sa-course-card__title">{program.name}</h3>
        {program.description ? <p className="sa-course-card__desc">{program.description}</p> : null}
        <div className="sa-course-card__footer">
          <span className="sa-course-card__price">Enroll</span>
          <span className="sa-course-card__rating" aria-label="Rated 5 out of 5">
            ★★★★★ <small>({program.levels.length || 1}+)</small>
          </span>
        </div>
        <SparkAcademyCta label={enrollLabel} href={enrollHref} variant="outline" className="sa-course-card__btn" />
      </div>
    </article>
  );
}

export function CoursesSection({
  programs,
  ctaHref,
  ctaLabel,
  title = "Courses designed for success",
  subtitle = "Explore programs built for real outcomes.",
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const tabs = useMemo(() => {
    const names = programs.map((p) => p.name);
    return ["All courses", ...names];
  }, [programs]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return programs;
    return programs.filter((p) => p.name === activeTab);
  }, [activeTab, programs]);

  if (programs.length === 0) return null;

  return (
    <section className="sa-courses" id="programs">
      <div className="sa-section-head">
        <h2 className="sa-section-title">{title}</h2>
        {subtitle ? <p className="sa-section-subtitle">{subtitle}</p> : null}
      </div>

      <div className="sa-courses__tabs" role="tablist" aria-label="Course categories">
        {tabs.map((tab) => {
          const value = tab === "All courses" ? "all" : tab;
          const selected = activeTab === value;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`sa-courses__tab${selected ? " sa-courses__tab--active" : ""}`}
              onClick={() => setActiveTab(value)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="sa-courses__grid">
        {filtered.map((program) => (
          <CourseCard
            key={program.name}
            program={program}
            index={programs.indexOf(program)}
            enrollHref={ctaHref}
            enrollLabel="Enroll now"
          />
        ))}
      </div>

      <div className="sa-courses__action">
        <SparkAcademyCta label="View all courses" href={ctaHref} variant="dark" />
      </div>
    </section>
  );
}
