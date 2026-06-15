import { Link } from "react-router-dom";
import { LearningPathTrack } from "@/features/learn/components/LearningPathTrack";
import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";
import { assessmentResultLabel, formatShortDate } from "@/features/learn/studentFormatters";
import type { ProgramLadder, ProgramLadderAssessment } from "@/lib/studentProgressApi";
import type { StudentLearnHome } from "@/lib/studentLearnApi";

type Props = {
  ladders: ProgramLadder[];
  assessments?: ProgramLadderAssessment[];
  recentResults?: StudentLearnHome["recent_results"];
  stats?: StudentLearnHome["stats"];
  completionPct?: number;
  loading?: boolean;
  error?: boolean;
};

function checkpointMeta(assessment: ProgramLadderAssessment): string {
  const parts: string[] = [];
  if (assessment.score != null && assessment.max_score) {
    parts.push(`Scored ${assessment.score}/${assessment.max_score}`);
  }
  const result = assessmentResultLabel(assessment.passed);
  if (result) parts.push(result);
  parts.push(formatShortDate(assessment.assessed_at));
  return parts.join(" · ");
}

function checkpointIcon(type: string) {
  if (type.toLowerCase().includes("lab")) return "🧪";
  if (type.toLowerCase().includes("quiz")) return "📝";
  return "📋";
}

export function LearningPathPanel({
  ladders,
  assessments = [],
  recentResults = [],
  stats,
  completionPct = 0,
  loading,
  error,
}: Props) {
  if (loading) {
    return <p className="ed-text-sm ed-muted">Loading your course levels…</p>;
  }

  if (error) {
    return <p className="ed-text-sm ed-muted">Unable to load your learning path right now.</p>;
  }

  const primary = ladders[0];
  const currentLevel = primary?.curriculum_ladder.levels.find(
    (l) => l.level_id === primary.curriculum_ladder.current_level_id || l.status === "in_progress"
  );

  const checkpoints =
    assessments.length > 0
      ? assessments.slice(0, 2).map((a) => ({
          id: a.id,
          title: a.level_name ? `${a.level_name}: ${a.assessment_type}` : a.assessment_type,
          meta: checkpointMeta(a),
          icon: checkpointIcon(a.assessment_type),
          locked: false,
        }))
      : [
          ...(currentLevel
            ? [
                {
                  id: "next-quiz",
                  title: `Level ${currentLevel.sort_order}: ${currentLevel.name}`,
                  meta: "Keep practicing to stay on track",
                  icon: "📝",
                  locked: false,
                },
              ]
            : []),
          {
            id: "next-lab",
            title: currentLevel
              ? `Next milestone · Level ${currentLevel.sort_order + 1}`
              : "Next milestone",
            meta:
              completionPct >= 70
                ? "Ready to unlock"
                : `Unlock at ${Math.max(70, completionPct + 10)}% progress`,
            icon: "🧪",
            locked: completionPct < 70,
          },
        ].slice(0, 2);

  const achievements = [
    ...recentResults.slice(0, 2).map((r, i) => ({
      id: `result-${i}`,
      label: r.result_rank ?? "Competition",
      icon: "🏆",
    })),
    ...(stats && stats.levels_completed > 0
      ? [{ id: "levels", label: `${stats.levels_completed} levels`, icon: "⭐" }]
      : []),
  ];

  const hasLadders = ladders.length > 0 && (primary?.curriculum_ladder.levels.length ?? 0) > 0;

  return (
    <div className="ed-sp-path-panel ed-sp-path-panel--desktop">
      {hasLadders ? (
        <LearningPathTrack ladders={ladders} limit={4} />
      ) : (
        <StudentEmptyState
          title="Learning path not ready yet"
          text="Join a batch or ask your center to assign your course — levels will appear here."
        />
      )}

      {checkpoints.length > 0 && (
        <div className="ed-sp-path-panel__checkpoints">
          <h3 className="ed-sp-path-panel__subhead">Upcoming Checkpoints</h3>
          <ul className="ed-sp-checkpoints ed-sp-checkpoints--desktop">
            {checkpoints.map((cp) => (
              <li
                key={cp.id}
                className={`ed-sp-checkpoints__item ed-sp-checkpoints__item--desktop${cp.locked ? " ed-sp-checkpoints__item--locked" : ""}`}
              >
                <span className="ed-sp-checkpoints__icon" aria-hidden>
                  {cp.icon}
                </span>
                <div>
                  <p className="ed-sp-checkpoints__title">{cp.title}</p>
                  <p className="ed-sp-checkpoints__meta">{cp.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {achievements.length > 0 && (
        <div className="ed-sp-path-panel__achievements">
          <h3 className="ed-sp-path-panel__subhead">Recent Achievements</h3>
          <div className="ed-sp-achievements ed-sp-achievements--desktop">
            {achievements.map((a) => (
              <span key={a.id} className="ed-sp-achievements__badge" title={a.label}>
                <span aria-hidden>{a.icon}</span>
              </span>
            ))}
            <Link to="/activity" className="ed-sp-achievements__more" aria-label="View all achievements">
              +
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
