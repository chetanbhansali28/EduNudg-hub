import { Link } from "react-router-dom";
import type { ProgramLadder } from "@/lib/studentProgressApi";

type Props = {
  ladders: ProgramLadder[];
  fallbackPct?: number;
  batchName?: string | null;
};

function pickCurrent(ladders: ProgramLadder[], fallbackPct: number) {
  for (const ladder of ladders) {
    const levels = ladder.curriculum_ladder.levels;
    const current =
      levels.find((l) => l.level_id === ladder.curriculum_ladder.current_level_id) ??
      levels.find((l) => l.status === "in_progress");
    if (current) {
      return {
        title: `Level ${current.sort_order}: ${current.name}`,
        pct: ladder.curriculum_ladder.completion_pct,
      };
    }
  }
  if (ladders[0]) {
    const level = ladders[0].curriculum_ladder.levels[0];
    return {
      title: level ? `Level ${level.sort_order}: ${level.name}` : "Your learning journey",
      pct: ladders[0].curriculum_ladder.completion_pct,
    };
  }
  return { title: "Your learning journey", pct: fallbackPct };
}

export function StudentMobileProgressCard({ ladders, fallbackPct = 0, batchName }: Props) {
  const current = pickCurrent(ladders, fallbackPct);
  const pct = current.pct;

  return (
    <article className="ed-sp-mobile-progress">
      <div className="ed-sp-mobile-progress__head">
        <span className="ed-sp-mobile-progress__eyebrow">Current progress</span>
        <span className="ed-sp-mobile-progress__pct">{pct}%</span>
      </div>
      <h2 className="ed-sp-mobile-progress__title">{current.title}</h2>
      <div
        className="ed-sp-mobile-progress__bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="ed-sp-mobile-progress__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="ed-sp-mobile-progress__foot">
        <div className="ed-sp-mobile-progress__peers" aria-hidden={!batchName}>
          {batchName ? (
            <>
              <span className="ed-sp-mobile-progress__avatar">A</span>
              <span className="ed-sp-mobile-progress__avatar">R</span>
              <span className="ed-sp-mobile-progress__avatar">K</span>
              <span className="ed-sp-mobile-progress__avatar ed-sp-mobile-progress__avatar--more">+12</span>
            </>
          ) : (
            <span className="ed-sp-mobile-progress__batch-hint">Join a batch to learn with classmates</span>
          )}
        </div>
        <Link to="/progress" className="ed-sp-mobile-progress__cta">
          Continue lesson
          <span aria-hidden>›</span>
        </Link>
      </div>
    </article>
  );
}
