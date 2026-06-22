import { Link } from "react-router-dom";
import { Button } from "@edunudg/ui";
import type { ProgramLadder } from "@/lib/studentProgressApi";

type Props = {
  ladders: ProgramLadder[];
  fallbackPct?: number;
  levelsCompleted?: number;
  levelsTotal?: number;
  assessmentsCount?: number;
  avgScorePct?: number | null;
  /** When false, hides the CTA (e.g. on /progress where the link would be a no-op). */
  showContinueCta?: boolean;
};

function pickCurrent(ladders: ProgramLadder[]) {
  for (const ladder of ladders) {
    const levels = ladder.curriculum_ladder.levels;
    const current =
      levels.find((l) => l.level_id === ladder.curriculum_ladder.current_level_id) ??
      levels.find((l) => l.status === "in_progress");
    if (current) {
      return {
        levelName: current.name,
        levelOrder: current.sort_order,
        pct: ladder.curriculum_ladder.completion_pct,
        completed: levels.filter((l) => l.status === "completed").length,
        total: levels.length,
      };
    }
  }
  const first = ladders[0];
  if (first) {
    const level = first.curriculum_ladder.levels[0];
    return {
      levelName: level?.name ?? "Getting started",
      levelOrder: level?.sort_order ?? 1,
      pct: first.curriculum_ladder.completion_pct,
      completed: first.curriculum_ladder.levels.filter((l) => l.status === "completed").length,
      total: first.curriculum_ladder.levels.length,
    };
  }
  return null;
}

export function StudentProgressHeroCard({
  ladders,
  fallbackPct = 0,
  levelsCompleted,
  levelsTotal,
  assessmentsCount,
  avgScorePct,
  showContinueCta = true,
}: Props) {
  const current = pickCurrent(ladders);
  const pct = current?.pct ?? fallbackPct;
  const done = levelsCompleted ?? current?.completed ?? 0;
  const total = levelsTotal ?? current?.total ?? 0;
  const title = current ? `Level ${current.levelOrder}: ${current.levelName}` : "Your learning journey";
  const secondStat =
    avgScorePct != null
      ? { value: `${Math.round(avgScorePct)}%`, label: "Avg score" }
      : assessmentsCount != null && assessmentsCount > 0
        ? { value: String(assessmentsCount), label: "Assessments" }
        : { value: "—", label: "Assessments" };

  return (
    <article className="ed-sp-course-card ed-sp-course-card--desktop">
      <div className="ed-sp-course-card__badge-row">
        <span className="ed-sp-course-card__badge">Active Level</span>
        <span className="ed-sp-course-card__icon" aria-hidden>
          📚
        </span>
      </div>

      <h2 className="ed-sp-course-card__title ed-sp-course-card__title--desktop">{title}</h2>

      <div className="ed-sp-course-card__bar-row">
        <div
          className="ed-sp-course-card__bar ed-sp-course-card__bar--desktop"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="ed-sp-course-card__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="ed-sp-course-card__pct">{pct}%</span>
      </div>

      <div className="ed-sp-course-card__stats ed-sp-course-card__stats--boxed">
        <div className="ed-sp-course-card__stat-box">
          <span className="ed-sp-course-card__stat-label">Levels done</span>
          <span className="ed-sp-course-card__stat-value">
            {done} / {total || "—"}
          </span>
        </div>
        <div className="ed-sp-course-card__stat-box">
          <span className="ed-sp-course-card__stat-label">{secondStat.label}</span>
          <span className="ed-sp-course-card__stat-value">{secondStat.value}</span>
        </div>
      </div>

      {showContinueCta ? (
        <Link to="/progress" className="ed-sp-course-card__cta-link ed-sp-course-card__cta-link--block">
          <Button variant="ghost">Continue Learning</Button>
        </Link>
      ) : null}
    </article>
  );
}
