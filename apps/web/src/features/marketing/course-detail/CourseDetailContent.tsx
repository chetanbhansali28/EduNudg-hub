import { Link } from "react-router-dom";
import type { PublicCurriculumLevel, PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { programMarketingBenefits } from "@/lib/brandCurriculumPublic";
import { toYoutubeEmbedUrl } from "@/lib/marketingPublicSite";
import { programCardPalette } from "@/lib/marketingFeatureSections";
import { programLessonLabel } from "@/features/marketing/spark-academy/curriculumHelpers";
import type { MarketingTheme } from "@/types/homepage";
import { AbacusCtaButton } from "@/features/marketing/abacus-classic/MarketingLeadModals";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/resolveLeadModalKind";
import { SparkAcademyCta } from "@/features/marketing/spark-academy/SparkAcademyCta";
import { EduLearnCta } from "@/features/marketing/edu-learn/EduLearnCta";
import "./course-detail.css";

type Props = {
  program: PublicCurriculumProgram;
  marketingTheme: MarketingTheme;
  enrollHref: string;
};

function courseEnrollHref(href: string): string {
  return resolveLeadModalKind(href) === "enroll" ? href : "#enroll";
}

function CourseVideo({ url, label }: { url: string; label: string }) {
  const embed = toYoutubeEmbedUrl(url);
  if (embed) {
    return (
      <div className="pub-course__video">
        <iframe
          title={label}
          src={embed}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a className="pub-course__video-link" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function EnrollCta({
  theme,
  href,
  className,
}: {
  theme: MarketingTheme;
  href: string;
  className?: string;
}) {
  const enrollClass = `pub-course__enroll-btn ${className ?? ""}`.trim();
  if (theme === "spark-academy") {
    return <SparkAcademyCta label="Enroll now" href={href} showArrow className={enrollClass} />;
  }
  if (theme === "edu-learn") {
    return <EduLearnCta label="Enroll now" href={href} variant="fill" className={enrollClass} />;
  }
  if (theme === "abacus-classic") {
    return <AbacusCtaButton label="Enroll now" href={href} className={enrollClass} />;
  }
  return (
    <a className={`pub-course__enroll-link ${enrollClass}`.trim()} href={href}>
      Enroll now
    </a>
  );
}

function levelLessonCount(level: PublicCurriculumLevel): number {
  return level.modules.reduce((count, mod) => count + mod.lessons.length, 0);
}

function LevelBlock({ level }: { level: PublicCurriculumLevel }) {
  const lessonCount = levelLessonCount(level);
  const moduleCount = level.modules.length;
  const meta =
    lessonCount > 0
      ? `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`
      : moduleCount > 0
        ? `${moduleCount} module${moduleCount === 1 ? "" : "s"}`
        : null;

  return (
    <details className="pub-course__level">
      <summary className="pub-course__level-summary">
        <span className="pub-course__level-heading">
          <span className="pub-course__level-name">{level.name}</span>
          {level.levelCode ? <span className="pub-course__level-code">{level.levelCode}</span> : null}
        </span>
        {meta ? <span className="pub-course__level-meta">{meta}</span> : null}
      </summary>
      <div className="pub-course__level-body">
        {level.whyTake || level.whatYouLearn ? (
          <div className="pub-course__level-panels">
            {level.whyTake ? (
              <section className="pub-course__panel">
                <h3 className="pub-course__panel-title">Why this level</h3>
                <p>{level.whyTake}</p>
              </section>
            ) : null}
            {level.whatYouLearn ? (
              <section className="pub-course__panel">
                <h3 className="pub-course__panel-title">Skills and outcomes</h3>
                <p className="pub-course__pre">{level.whatYouLearn}</p>
              </section>
            ) : null}
          </div>
        ) : null}
        {level.topicsCovered.length > 0 ? (
          <section className="pub-course__level-topics">
            <h3 className="pub-course__panel-title">Topics covered</h3>
            <ul className="pub-course__topic-chips">
              {level.topicsCovered.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {level.marketingVideoUrl ? <CourseVideo url={level.marketingVideoUrl} label="Watch level overview" /> : null}
        {level.modules.map((mod) => (
          <section key={mod.title} className="pub-course__module">
            <h3 className="pub-course__module-title">{mod.title}</h3>
            {mod.lessons.length > 0 ? (
              <ol className="pub-course__lessons">
                {mod.lessons.map((lesson, index) => (
                  <li key={lesson.title}>
                    <span className="pub-course__lesson-index" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pub-course__lesson-title">{lesson.title}</span>
                    {lesson.durationMinutes != null ? (
                      <span className="pub-course__lesson-time">{lesson.durationMinutes} min</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}
      </div>
    </details>
  );
}

function themeMainClass(theme: MarketingTheme): string {
  if (theme === "spark-academy") return "sa-main sa-course-detail pub-course pub-course--spark";
  if (theme === "abacus-classic") return "ac-main ac-course-detail pub-course pub-course--abacus";
  if (theme === "edu-learn") return "el-main el-course-detail pub-course pub-course--edu-learn";
  return "pub-course pub-course--novu";
}

function OfferCard({
  program,
  theme,
  enrollHref,
  imageUrl,
  lessonLabel,
  scholarship,
}: {
  program: PublicCurriculumProgram;
  theme: MarketingTheme;
  enrollHref: string;
  imageUrl: string | null;
  lessonLabel: string;
  scholarship: string | null;
}) {
  const palette = programCardPalette(0);
  return (
    <aside className="pub-course__offer" aria-label="Enroll in this course">
      <div
        className={`pub-course__offer-media${imageUrl ? " pub-course__offer-media--image" : ""}`}
        style={
          imageUrl ? undefined : { background: `linear-gradient(145deg, ${palette.bg}, #0f172a)` }
        }
      >
        {imageUrl ? (
          <img className="pub-course__offer-photo" src={imageUrl} alt={`${program.name} preview`} />
        ) : (
          <span className="pub-course__offer-icon" aria-hidden>
            {palette.icon}
          </span>
        )}
      </div>
      <div className="pub-course__offer-body">
        <p className="pub-course__offer-kicker">Start this program</p>
        <p className="pub-course__offer-title">{program.name}</p>
        <ul className="pub-course__offer-facts">
          {program.ageLabel?.trim() ? <li>{program.ageLabel}</li> : null}
          {program.levels.length > 0 ? (
            <li>
              {program.levels.length} level{program.levels.length === 1 ? "" : "s"}
            </li>
          ) : null}
          <li>{lessonLabel}</li>
        </ul>
        {scholarship ? (
          <p className="pub-course__offer-scholarship" role="note">
            <span aria-hidden>🏆</span>
            <strong>{scholarship}</strong>
          </p>
        ) : null}
        <EnrollCta theme={theme} href={enrollHref} />
        <p className="pub-course__offer-hint">Opens a short form — no payment on this step.</p>
      </div>
    </aside>
  );
}

export function CourseDetailContent({ program, marketingTheme, enrollHref }: Props) {
  const benefits = programMarketingBenefits(program);
  const imageUrl = program.marketingImageUrl?.trim() || null;
  const videoUrl = program.marketingVideoUrl?.trim() || null;
  const scholarship = program.scholarshipHighlight?.trim() || null;
  const lessonLabel = programLessonLabel(program);
  const actionHref = courseEnrollHref(enrollHref);

  return (
    <main className={themeMainClass(marketingTheme)}>
      <header className="pub-course__hero">
        <div className="pub-course__hero-inner">
          <div className="pub-course__hero-copy">
            <nav className="pub-course__crumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/#programs">Courses</Link>
                </li>
                <li aria-current="page">{program.name}</li>
              </ol>
            </nav>
            {program.ageLabel?.trim() ? <p className="pub-course__badge">{program.ageLabel}</p> : null}
            <h1 className="pub-course__title">{program.name}</h1>
            {program.description?.trim() ? <p className="pub-course__lede">{program.description}</p> : null}
            <ul className="pub-course__facts">
              {program.levels.length > 0 ? (
                <li>
                  <strong>{program.levels.length}</strong>
                  <span>Levels</span>
                </li>
              ) : null}
              <li>
                <strong>{lessonLabel}</strong>
                <span>Curriculum</span>
              </li>
            </ul>
          </div>
          <div className="pub-course__hero-spacer" aria-hidden />
        </div>
      </header>

      <div className="pub-course__stage">
        <div className="pub-course__rail">
          <OfferCard
            program={program}
            theme={marketingTheme}
            enrollHref={actionHref}
            imageUrl={imageUrl}
            lessonLabel={lessonLabel}
            scholarship={scholarship}
          />
        </div>
        <article className="pub-course__article">
        {videoUrl ? <CourseVideo url={videoUrl} label="Watch course preview" /> : null}
        {program.whyTake?.trim() ? (
          <section className="pub-course__block">
            <h2 className="pub-course__h2">Why parents choose this</h2>
            <p>{program.whyTake}</p>
          </section>
        ) : null}
        {program.whatYouLearn?.trim() ? (
          <section className="pub-course__block">
            <h2 className="pub-course__h2">Skills and outcomes</h2>
            <p className="pub-course__pre">{program.whatYouLearn}</p>
          </section>
        ) : null}
        {benefits.length > 0 ? (
          <section className="pub-course__block">
            <h2 className="pub-course__h2">Benefits of {program.name}</h2>
            <ul className="pub-course__benefits ac-program-details__benefits-list">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {scholarship ? (
          <p className="pub-course__scholarship ac-program-details__scholarship" role="note">
            <span className="ac-program-details__scholarship-icon" aria-hidden>
              🏆
            </span>
            <strong>{scholarship}</strong>
          </p>
        ) : null}
        {program.levels.length > 0 ? (
          <section className="pub-course__block" id="syllabus">
            <h2 className="pub-course__h2">Syllabus</h2>
            {program.levels.map((level) => (
              <LevelBlock key={`${program.name}-${level.name}`} level={level} />
            ))}
          </section>
        ) : null}
      </article>
      </div>

      <div className="pub-course__dock">
        <p className="pub-course__dock-name">{program.name}</p>
        <EnrollCta theme={marketingTheme} href={actionHref} />
      </div>
    </main>
  );
}
