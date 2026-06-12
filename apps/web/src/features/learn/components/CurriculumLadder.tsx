import { Link } from "react-router-dom";
import { formatShortDate, levelStatusLabel } from "@/features/learn/studentFormatters";
import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";

export type LadderLevel = {
  level_id: string;
  name: string;
  sort_order: number;
  status: string;
  completed_at: string | null;
  abacus_level_code: string | null;
};

type Props = {
  levels: LadderLevel[];
  completionPct: number;
  curriculumLabel?: string | null;
  limit?: number;
  progressLink?: string;
};

function stepClass(status: string): string {
  if (status === "completed") return "ed-sp-ladder__step ed-sp-ladder__step--completed";
  if (status === "in_progress") return "ed-sp-ladder__step ed-sp-ladder__step--in_progress";
  return "ed-sp-ladder__step";
}

export function CurriculumLadder({
  levels,
  completionPct,
  curriculumLabel,
  limit,
  progressLink,
}: Props) {
  if (levels.length === 0) {
    return (
      <StudentEmptyState
        title="Curriculum coming soon"
        text="Your center has not assigned a curriculum yet. Check back after your next class."
      />
    );
  }

  const visible = limit ? levels.slice(0, limit) : levels;

  return (
    <>
      <div className="ed-sp-ladder__summary">
        <div>
          <p className="ed-sp-ladder__pct">{completionPct}%</p>
          <p className="ed-text-sm ed-muted">{curriculumLabel ?? "Curriculum progress"}</p>
        </div>
        <div className="ed-sp-ladder__bar" aria-hidden>
          <div className="ed-sp-ladder__bar-fill" style={{ width: `${completionPct}%` }} />
        </div>
      </div>
      <div className="ed-sp-ladder">
        {visible.map((level) => (
          <div key={level.level_id} className={stepClass(level.status)}>
            <span className="ed-sp-ladder__dot" aria-hidden />
            <div>
              <p className="ed-sp-ladder__step-name">{level.name}</p>
              {level.completed_at && (
                <p className="ed-sp-ladder__step-meta">Completed {formatShortDate(level.completed_at)}</p>
              )}
            </div>
            <span className="ed-sp-ladder__status">{levelStatusLabel(level.status)}</span>
          </div>
        ))}
      </div>
      {progressLink && limit && levels.length > limit ? (
        <p className="ed-text-sm" style={{ marginTop: "0.85rem" }}>
          <Link to={progressLink}>View all {levels.length} levels</Link>
        </p>
      ) : null}
    </>
  );
}
