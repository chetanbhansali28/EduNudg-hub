import type {
  PublicCurriculumLesson,
  PublicCurriculumLevel,
  PublicCurriculumProgram,
} from "@/lib/brandCurriculumPublic";

type Props = {
  programs: PublicCurriculumProgram[];
};

function LessonList({ lessons }: { lessons: PublicCurriculumLesson[] }) {
  if (lessons.length === 0) return null;

  return (
    <ul className="ac-curriculum__lessons">
      {lessons.map((lesson) => (
        <li key={lesson.title} className="ac-curriculum__lesson">
          <span className="ac-curriculum__lesson-title">{lesson.title}</span>
          {lesson.durationMinutes != null ? (
            <span className="ac-curriculum__lesson-meta">{lesson.durationMinutes} min</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function LevelBlock({ level }: { level: PublicCurriculumLevel }) {
  const chapterCount = level.modules.length;

  return (
    <details className="ac-curriculum__level">
      <summary className="ac-curriculum__level-summary">
        <span className="ac-curriculum__level-name">{level.name}</span>
        {level.levelCode ? (
          <span className="ac-curriculum__level-code">{level.levelCode}</span>
        ) : null}
        <span className="ac-curriculum__level-meta">
          {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
        </span>
      </summary>
      <div className="ac-curriculum__level-body">
        {level.whyTake ? (
          <p className="ac-curriculum__level-copy">
            <strong>Why this level</strong>
            <br />
            {level.whyTake}
          </p>
        ) : null}
        {level.whatYouLearn ? (
          <p className="ac-curriculum__level-copy">
            <strong>What you will learn</strong>
            <br />
            {level.whatYouLearn}
          </p>
        ) : null}
        {level.topicsCovered.length > 0 ? (
          <ul className="ac-curriculum__topics">
            {level.topicsCovered.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        ) : null}
        {level.modules.map((mod) => (
          <div key={mod.title} className="ac-curriculum__module">
            <h4 className="ac-curriculum__module-title">{mod.title}</h4>
            <LessonList lessons={mod.lessons} />
          </div>
        ))}
      </div>
    </details>
  );
}

function CourseBlock({ program }: { program: PublicCurriculumProgram }) {
  return (
    <article className="ac-curriculum__course">
      <header className="ac-curriculum__course-head">
        <h3 className="ac-curriculum__course-name">{program.name}</h3>
        {program.description ? (
          <p className="ac-curriculum__course-desc">{program.description}</p>
        ) : null}
      </header>
      {program.levels.length > 0 ? (
        <div className="ac-curriculum__levels">
          {program.levels.map((level) => (
            <LevelBlock key={`${program.name}-${level.name}`} level={level} />
          ))}
        </div>
      ) : (
        <p className="ac-curriculum__empty-levels">Programs and chapters will appear here once published.</p>
      )}
    </article>
  );
}

/** Full published syllabus at #curriculum — separate from the marketing programs grid. */
export function AbacusCurriculumSection({ programs }: Props) {
  if (programs.length === 0) return null;

  return (
    <section className="ac-curriculum" id="curriculum">
      <div className="ac-curriculum__inner">
        <header className="ac-curriculum__head">
          <p className="ac-curriculum__eyebrow">OUR SYLLABUS</p>
          <h2 className="ac-curriculum__title">Structured learning path</h2>
          <p className="ac-curriculum__subtitle">
            Course → program → chapter — the same structure you publish in Curriculum.
          </p>
          <span className="ac-curriculum__accent" aria-hidden />
        </header>
        <div className="ac-curriculum__courses">
          {programs.map((program) => (
            <CourseBlock key={program.name} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}
