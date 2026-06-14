import { levelStatusLabel } from "@/features/learn/studentFormatters";
import { HorizontalScrollTrack } from "@/features/learn/components/HorizontalScrollTrack";
import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";
import type { ProgramLadder, ProgramLadderLevel } from "@/lib/studentProgressApi";

type Props = {
  ladders: ProgramLadder[];
};

function levelCardClass(status: string): string {
  if (status === "completed") return "ed-sp-path-card ed-sp-path-card--completed";
  if (status === "in_progress") return "ed-sp-path-card ed-sp-path-card--current";
  return "ed-sp-path-card ed-sp-path-card--upcoming";
}

function ProgramOverviewCard({ ladder }: { ladder: ProgramLadder }) {
  const batchLabel =
    ladder.batches.length > 0
      ? ladder.batches.map((b) => b.batch_name).join(", ")
      : "Your course";

  return (
    <article className="ed-sp-path-card ed-sp-path-card--program">
      <p className="ed-sp-path-card__eyebrow">Current program</p>
      <p className="ed-sp-path-card__title">{ladder.program_name}</p>
      <p className="ed-sp-path-card__meta">{batchLabel}</p>
      <p className="ed-sp-path-card__pct">{ladder.curriculum_ladder.completion_pct}% complete</p>
    </article>
  );
}

function LevelPathCard({ level, programName }: { level: ProgramLadderLevel; programName: string }) {
  return (
    <article className={levelCardClass(level.status)}>
      <p className="ed-sp-path-card__eyebrow">{programName}</p>
      <p className="ed-sp-path-card__title">{level.name}</p>
      {level.abacus_level_code ? (
        <p className="ed-sp-path-card__meta">{level.abacus_level_code}</p>
      ) : null}
      <p className="ed-sp-path-card__status">{levelStatusLabel(level.status)}</p>
    </article>
  );
}

export function LearningPathCarousel({ ladders }: Props) {
  if (ladders.length === 0) {
    return (
      <StudentEmptyState
        title="Learning path not ready yet"
        text="Join a batch or ask your center to assign your course — levels will appear here."
      />
    );
  }

  const cards = ladders.flatMap((ladder) => {
    const levels = ladder.curriculum_ladder.levels;
    const currentIdx = levels.findIndex(
      (l) => l.level_id === ladder.curriculum_ladder.current_level_id || l.status === "in_progress"
    );
    const startIdx = currentIdx >= 0 ? Math.max(0, currentIdx - 1) : 0;
    const visibleLevels =
      levels.length > 0 && currentIdx >= 0 ? levels.slice(startIdx) : levels;

    return [
      <ProgramOverviewCard key={`program-${ladder.program_id}`} ladder={ladder} />,
      ...visibleLevels.map((level) => (
        <LevelPathCard key={level.level_id} level={level} programName={ladder.program_name} />
      )),
      ...(levels.length === 0
        ? [
            <article key={`empty-${ladder.program_id}`} className="ed-sp-path-card ed-sp-path-card--upcoming">
              <p className="ed-sp-path-card__title">Levels coming soon</p>
              <p className="ed-sp-path-card__meta">Your center is publishing curriculum steps.</p>
            </article>,
          ]
        : []),
    ];
  });

  return <HorizontalScrollTrack ariaLabel="Your learning path">{cards}</HorizontalScrollTrack>;
}
