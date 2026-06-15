import { Link } from "react-router-dom";
import { formatShortDate, levelStatusLabel } from "@/features/learn/studentFormatters";
import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";
import type { ProgramLadder, ProgramLadderLevel } from "@/lib/studentProgressApi";

type Props = {
  ladders: ProgramLadder[];
  limit?: number;
  progressLink?: string;
  completionPct?: number;
};

function levelDescription(level: ProgramLadderLevel, programName: string): string | null {
  if (level.status === "failed") {
    return `Did not pass ${programName} at this level — review with your teacher and try again.`;
  }
  if (level.status === "in_progress") {
    return `Focused on ${programName} — keep practicing to unlock the next level.`;
  }
  if (level.status === "not_started" || level.status === "locked") {
    const prevOrder = Math.max(1, level.sort_order - 1);
    return `Prerequisite: Level ${prevOrder} completion`;
  }
  return null;
}

function TimelineNode({ level }: { level: ProgramLadderLevel; index: number }) {
  const isCompleted = level.status === "completed";
  const isFailed = level.status === "failed";
  const isCurrent = level.status === "in_progress";
  const isLocked = !isCompleted && !isCurrent && !isFailed;

  return (
    <span
      className={[
        "ed-sp-timeline__node",
        isCompleted ? "ed-sp-timeline__node--done" : "",
        isFailed ? "ed-sp-timeline__node--failed" : "",
        isCurrent ? "ed-sp-timeline__node--current" : "",
        isLocked ? "ed-sp-timeline__node--locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {isCompleted ? "✓" : isFailed ? "✗" : isLocked ? "🔒" : level.sort_order}
    </span>
  );
}

function TimelineRow({
  level,
  programName,
  completionPct,
}: {
  level: ProgramLadderLevel;
  programName: string;
  completionPct?: number;
}) {
  const isCompleted = level.status === "completed";
  const isFailed = level.status === "failed";
  const isCurrent = level.status === "in_progress";
  const isLocked = !isCompleted && !isCurrent && !isFailed;
  const description = levelDescription(level, programName);

  return (
    <li
      className={[
        "ed-sp-timeline__item",
        isCompleted ? "ed-sp-timeline__item--done" : "",
        isFailed ? "ed-sp-timeline__item--failed" : "",
        isCurrent ? "ed-sp-timeline__item--current" : "",
        isLocked ? "ed-sp-timeline__item--locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TimelineNode level={level} index={level.sort_order - 1} />
      <div className="ed-sp-timeline__card">
        {isCurrent && <span className="ed-sp-timeline__badge">Current</span>}
        {isFailed && (
          <span className="ed-sp-timeline__badge ed-sp-timeline__badge--fail">
            {levelStatusLabel(level.status)}
          </span>
        )}
        <p className="ed-sp-timeline__level-label">
          Level {level.sort_order}: {level.name}
        </p>
        {isCompleted && level.completed_at && (
          <p className="ed-sp-timeline__meta">Completed on {formatShortDate(level.completed_at)}</p>
        )}
        {description && <p className="ed-sp-timeline__desc">{description}</p>}
        {isCurrent && (
          <div className="ed-sp-timeline__mini-bar" aria-hidden>
            <div
              className="ed-sp-timeline__mini-bar-fill"
              style={{ width: `${completionPct ?? 45}%` }}
            />
          </div>
        )}
      </div>
    </li>
  );
}

export function LearningPathTimeline({ ladders, limit, progressLink, completionPct }: Props) {
  if (ladders.length === 0) {
    return (
      <StudentEmptyState
        title="Learning path not ready yet"
        text="Join a batch or ask your center to assign your course — levels will appear here."
      />
    );
  }

  const primary = ladders[0];
  const levels = primary.curriculum_ladder.levels;
  const visible = limit ? levels.slice(0, limit) : levels;
  const hiddenCount = limit && levels.length > limit ? levels.length - limit : 0;

  if (levels.length === 0) {
    return (
      <StudentEmptyState
        title="Levels coming soon"
        text="Your center is publishing curriculum steps for this program."
      />
    );
  }

  return (
    <>
      <ol className="ed-sp-timeline">
        {visible.map((level) => (
          <TimelineRow
            key={level.level_id}
            level={level}
            programName={primary.program_name}
            completionPct={completionPct}
          />
        ))}
      </ol>
      {progressLink && hiddenCount > 0 && (
        <p className="ed-sp-timeline__more">
          <Link to={progressLink}>View all {levels.length} levels</Link>
        </p>
      )}
    </>
  );
}

/** Full timeline for progress page — all programs */
export function LearningPathTimelineMulti({ ladders }: { ladders: ProgramLadder[] }) {
  if (ladders.length === 0) {
    return (
      <StudentEmptyState
        title="Nothing to show yet"
        text="Your program levels will appear once you're enrolled and assigned a course."
      />
    );
  }

  return (
    <div className="ed-sp-timeline-multi">
      {ladders.map((ladder) => (
        <section key={ladder.program_id} className="ed-sp-timeline-multi__program">
          <h3 className="ed-sp-timeline-multi__program-name">{ladder.program_name}</h3>
          {ladder.curriculum_ladder.levels.length === 0 ? (
            <p className="ed-text-sm ed-muted">Levels not published yet.</p>
          ) : (
            <ol className="ed-sp-timeline">
              {ladder.curriculum_ladder.levels.map((level) => (
                <TimelineRow
                  key={level.level_id}
                  level={level}
                  programName={ladder.program_name}
                  completionPct={ladder.curriculum_ladder.completion_pct}
                />
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
