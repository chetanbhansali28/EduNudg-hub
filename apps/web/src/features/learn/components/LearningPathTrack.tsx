import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";
import type { ProgramLadder, ProgramLadderLevel } from "@/lib/studentProgressApi";

type Props = {
  ladders: ProgramLadder[];
  limit?: number;
};

function StepNode({ level }: { level: ProgramLadderLevel }) {
  const isCompleted = level.status === "completed";
  const isCurrent = level.status === "in_progress";
  const isLocked = !isCompleted && !isCurrent;

  return (
    <span
      className={[
        "ed-sp-path-track__node",
        "ed-sp-path-track__node--rail",
        isCompleted ? "ed-sp-path-track__node--done" : "",
        isCurrent ? "ed-sp-path-track__node--current" : "",
        isLocked ? "ed-sp-path-track__node--locked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {isCompleted ? "✓" : isCurrent ? "📚" : "🔒"}
      {isCurrent ? <span className="ed-sp-path-track__pulse" aria-hidden /> : null}
    </span>
  );
}

export function LearningPathTrack({ ladders, limit }: Props) {
  if (ladders.length === 0) {
    return (
      <StudentEmptyState
        title="Learning path not ready yet"
        text="Join a batch or ask your center to assign your course — levels will appear here."
      />
    );
  }

  const primary = ladders[0];
  const levels = limit ? primary.curriculum_ladder.levels.slice(0, limit) : primary.curriculum_ladder.levels;

  if (levels.length === 0) {
    return (
      <StudentEmptyState
        title="Levels coming soon"
        text="Your center is publishing curriculum steps for this program."
      />
    );
  }

  return (
    <div className="ed-sp-path-track ed-sp-path-track--dashboard">
      <div className="ed-sp-path-track__rail ed-sp-path-track__rail--dashboard" aria-hidden />
      <ol className="ed-sp-path-track__steps ed-sp-path-track__steps--dashboard">
        {levels.map((level) => {
          const isCurrent = level.status === "in_progress";
          return (
            <li
              key={level.level_id}
              className={`ed-sp-path-track__step ed-sp-path-track__step--dashboard${isCurrent ? " ed-sp-path-track__step--current" : ""}`}
            >
              <StepNode level={level} />
              <span className="ed-sp-path-track__step-label">Level {level.sort_order}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
