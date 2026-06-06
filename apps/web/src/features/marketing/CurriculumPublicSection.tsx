import { useRef } from "react";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";

function VideoLink({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} className="novu-curriculum-card__video-link" target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function LessonList({ lessons }: { lessons: PublicCurriculumProgram["levels"][number]["modules"][number]["lessons"] }) {
  if (lessons.length === 0) return null;
  return (
    <ul className="novu-curriculum-card__lessons">
      {lessons.map((lesson) => (
        <li key={lesson.title}>
          <span className="novu-curriculum-card__lesson-title">{lesson.title}</span>
          {lesson.durationMinutes != null && (
            <span className="novu-curriculum-card__lesson-meta">{lesson.durationMinutes} min</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function LevelBlock({ level }: { level: PublicCurriculumProgram["levels"][number] }) {
  return (
    <details className="novu-curriculum-card__level">
      <summary className="novu-curriculum-card__level-summary">
        <span className="novu-curriculum-card__level-name">{level.name}</span>
        {level.levelCode && <span className="novu-curriculum-card__level-code">{level.levelCode}</span>}
      </summary>
      <div className="novu-curriculum-card__level-body">
        {level.whyTake && (
          <p>
            <strong>Why this level</strong>
            <br />
            {level.whyTake}
          </p>
        )}
        {level.whatYouLearn && (
          <p>
            <strong>What you will learn</strong>
            <br />
            {level.whatYouLearn}
          </p>
        )}
        {level.topicsCovered.length > 0 && (
          <ul className="novu-curriculum-card__topics">
            {level.topicsCovered.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        )}
        {level.marketingVideoUrl && <VideoLink url={level.marketingVideoUrl} label="Watch level overview" />}
        {level.modules.map((mod) => (
          <div key={mod.title} className="novu-curriculum-card__module">
            <h4 className="novu-curriculum-card__module-title">{mod.title}</h4>
            <LessonList lessons={mod.lessons} />
          </div>
        ))}
      </div>
    </details>
  );
}

function ProgramCard({ program }: { program: PublicCurriculumProgram }) {
  const titleParts = program.name.match(/^(.+?)(\s+)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? program.name;
  const titleSerif = titleParts?.[3] ?? "";

  return (
    <article className="novu-curriculum-card-wrap">
      <div className="novu-curriculum-card">
        <header className="novu-curriculum-card__header">
          <h3 className="novu-curriculum-card__title">
            {titleSerif ? (
              <>
                {titleMain} <span className="serif">{titleSerif}</span>
              </>
            ) : (
              program.name
            )}
          </h3>
          {program.versionNumber > 0 && (
            <span className="novu-curriculum-card__version">v{program.versionNumber}</span>
          )}
        </header>

        <div className="novu-curriculum-card__body">
          {program.description && <p className="novu-curriculum-card__desc">{program.description}</p>}
          {program.whyTake && (
            <div className="novu-curriculum-card__block">
              <h4 className="novu-curriculum-card__label">Why take this program</h4>
              <p>{program.whyTake}</p>
            </div>
          )}
          {program.whatYouLearn && (
            <div className="novu-curriculum-card__block">
              <h4 className="novu-curriculum-card__label">What you will learn</h4>
              <p>{program.whatYouLearn}</p>
            </div>
          )}
          {program.marketingVideoUrl && (
            <VideoLink url={program.marketingVideoUrl} label="Watch program overview" />
          )}
          {program.levels.length > 0 && (
            <div className="novu-curriculum-card__levels">
              <h4 className="novu-curriculum-card__label">Levels in this program</h4>
              {program.levels.map((level) => (
                <LevelBlock key={`${program.name}-${level.name}`} level={level} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

type Props = {
  programs: PublicCurriculumProgram[];
  title?: string;
  subtitle?: string;
};

export function CurriculumPublicSection({
  programs,
  title = "Our curriculum",
  subtitle = "Structured levels designed for steady progress from foundations to mastery.",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (programs.length === 0) return null;

  const titleParts = title.match(/^(.+?)(\s*)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? title;
  const titleSerif = titleParts?.[3] ?? "";

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".novu-curriculum-card-wrap");
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "16") || 16;
    const w = card?.offsetWidth ?? 360;
    el.scrollBy({ left: dir * (w + gap), behavior: "smooth" });
  };

  return (
    <section id="curriculum" data-nav-theme="light" className="novu-curriculum-section">
      <div className="novu-curriculum-section__header novu-reveal">
        <h2>
          {titleMain} <span className="serif">{titleSerif}</span>
        </h2>
        <p>{subtitle}</p>
      </div>
      <div ref={scrollerRef} className="novu-curriculum-section__scroller">
        {programs.map((program) => (
          <ProgramCard key={program.name} program={program} />
        ))}
      </div>
      {programs.length > 1 && (
        <div className="novu-curriculum-section__controls">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll programs left">
            ←
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll programs right">
            →
          </button>
        </div>
      )}
    </section>
  );
}
