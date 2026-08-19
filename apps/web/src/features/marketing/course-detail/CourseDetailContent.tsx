import type { PublicCurriculumLevel, PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { programMarketingBenefits } from "@/lib/brandCurriculumPublic";
import { toYoutubeEmbedUrl } from "@/lib/marketingPublicSite";
import type { MarketingTheme } from "@/types/homepage";
import { AbacusCtaButton } from "@/features/marketing/abacus-classic/MarketingLeadModals";
import { SparkAcademyCta } from "@/features/marketing/spark-academy/SparkAcademyCta";
import { EduLearnCta } from "@/features/marketing/edu-learn/EduLearnCta";
import "./course-detail.css";

type Props = {
  program: PublicCurriculumProgram;
  marketingTheme: MarketingTheme;
  enrollHref: string;
};

function CourseVideo({ url, label }: { url: string; label: string }) {
  const embed = toYoutubeEmbedUrl(url);
  if (embed) {
    return (
      <div className="pub-course__video">
        <iframe title={label} src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return (
    <a className="pub-course__video-link" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function EnrollCta({ theme, href }: { theme: MarketingTheme; href: string }) {
  if (theme === "spark-academy") {
    return <SparkAcademyCta label="Enroll now" href={href} />;
  }
  if (theme === "edu-learn") {
    return <EduLearnCta label="Enroll now" href={href} />;
  }
  if (theme === "abacus-classic") {
    return <AbacusCtaButton label="Enroll now" href={href} />;
  }
  return (
    <a className="pub-course__enroll-link" href={href}>
      Enroll now
    </a>
  );
}

function LevelBlock({ level }: { level: PublicCurriculumLevel }) {
  return (
    <details className="pub-course__level">
      <summary className="pub-course__level-summary">
        <span>{level.name}</span>
        {level.levelCode ? <span className="pub-course__level-code">{level.levelCode}</span> : null}
      </summary>
      <div className="pub-course__level-body">
        {level.whyTake ? (
          <p>
            <strong>Why this program</strong>
            <br />
            {level.whyTake}
          </p>
        ) : null}
        {level.whatYouLearn ? (
          <p>
            <strong>Skills and outcomes</strong>
            <br />
            {level.whatYouLearn}
          </p>
        ) : null}
        {level.topicsCovered.length > 0 ? (
          <ul className="pub-course__topics">
            {level.topicsCovered.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        ) : null}
        {level.marketingVideoUrl ? <CourseVideo url={level.marketingVideoUrl} label="Watch level overview" /> : null}
        {level.modules.map((mod) => (
          <div key={mod.title} className="pub-course__module">
            <h3 className="pub-course__module-title">{mod.title}</h3>
            {mod.lessons.length > 0 ? (
              <ul className="pub-course__lessons">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.title}>
                    <span>{lesson.title}</span>
                    {lesson.durationMinutes != null ? <span>{lesson.durationMinutes} min</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  );
}

function themeMainClass(theme: MarketingTheme): string {
  if (theme === "spark-academy") return "sa-main sa-course-detail pub-course";
  if (theme === "abacus-classic") return "ac-main ac-course-detail pub-course";
  if (theme === "edu-learn") return "el-main el-course-detail pub-course";
  return "pub-course pub-course--novu";
}

function headingClass(theme: MarketingTheme, kind: "h1" | "h2"): string {
  if (theme === "spark-academy") {
    return kind === "h1" ? "sa-section-title" : "sa-item-title";
  }
  return "";
}

export function CourseDetailContent({ program, marketingTheme, enrollHref }: Props) {
  const benefits = programMarketingBenefits(program);
  const imageUrl = program.marketingImageUrl?.trim() || null;
  const videoUrl = program.marketingVideoUrl?.trim() || null;
  const titleClass = headingClass(marketingTheme, "h1");
  const sectionClass = headingClass(marketingTheme, "h2");

  return (
    <main className={themeMainClass(marketingTheme)}>
      <article className="pub-course__article">
        {imageUrl ? (
          <div className="pub-course__banner" style={{ backgroundImage: `url(${imageUrl})` }} role="img" aria-label="" />
        ) : null}
        {program.ageLabel?.trim() ? <p className="pub-course__badge">{program.ageLabel}</p> : null}
        <h1 className={titleClass || undefined}>{program.name}</h1>
        {program.description?.trim() ? <p className="pub-course__lede">{program.description}</p> : null}
        <div className="pub-course__enroll">
          <EnrollCta theme={marketingTheme} href={enrollHref} />
        </div>
        {videoUrl ? <CourseVideo url={videoUrl} label="Watch course preview" /> : null}
        {program.whyTake?.trim() ? (
          <section className="pub-course__block">
            <h2 className={sectionClass || undefined}>Why parents choose this</h2>
            <p>{program.whyTake}</p>
          </section>
        ) : null}
        {program.whatYouLearn?.trim() ? (
          <section className="pub-course__block">
            <h2 className={sectionClass || undefined}>Skills and outcomes</h2>
            <p className="pub-course__pre">{program.whatYouLearn}</p>
          </section>
        ) : null}
        {benefits.length > 0 ? (
          <section className="pub-course__block">
            <h2 className={sectionClass || undefined}>Benefits of {program.name}</h2>
            <ul className="pub-course__benefits ac-program-details__benefits-list">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {program.scholarshipHighlight?.trim() ? (
          <p className="pub-course__scholarship ac-program-details__scholarship" role="note">
            <span className="ac-program-details__scholarship-icon" aria-hidden>
              🏆
            </span>
            <strong>{program.scholarshipHighlight}</strong>
          </p>
        ) : null}
        {program.levels.length > 0 ? (
          <section className="pub-course__block">
            <h2 className={sectionClass || undefined}>Syllabus</h2>
            {program.levels.map((level) => (
              <LevelBlock key={`${program.name}-${level.name}`} level={level} />
            ))}
          </section>
        ) : null}
      </article>
    </main>
  );
}
