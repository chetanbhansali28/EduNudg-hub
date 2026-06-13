import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, PageTitle, PipelineDetailPlaceholder, PipelineMasterDetail } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CurriculumLadder } from "@/features/learn/components/CurriculumLadder";
import { SectionCard, StudentEmptyState, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { formatShortDate } from "@/features/learn/studentFormatters";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";
import {
  shouldRetryStudentLearnQuery,
  studentProgressEmptyMessage,
  studentProgressErrorMessage,
} from "@/lib/studentLearnErrors";
import { fetchStudentProgramLadders, type ProgramLadder } from "@/lib/studentProgressApi";
import "@/features/center/centerOps.css";

function LadderList({
  ladders,
  selectedId,
  onSelect,
}: {
  ladders: ProgramLadder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="ed-sp-ladder-picker ed-ops-stagger" role="listbox" aria-label="Your programs">
      {ladders.map((l) => {
        const selected = l.curriculum_version_id === selectedId;
        const batchLabel =
          l.batches.length > 0
            ? l.batches.map((b) => b.batch_name).join(", ")
            : "Enrollment curriculum";
        return (
          <button
            key={l.curriculum_version_id}
            type="button"
            role="option"
            aria-selected={selected}
            className={`ed-sp-ladder-picker__item${selected ? " ed-sp-ladder-picker__item--selected" : ""}`}
            onClick={() => onSelect(l.curriculum_version_id)}
          >
            <strong>{l.program_name}</strong>
            <div className="ed-text-sm ed-muted">{l.curriculum_label}</div>
            <div className="ed-text-sm ed-muted">{batchLabel}</div>
            <div className="ed-text-sm">{l.curriculum_ladder.completion_pct}% complete</div>
          </button>
        );
      })}
    </div>
  );
}

function LadderDetail({ ladder }: { ladder: ProgramLadder }) {
  return (
    <div className="ed-ops-detail-enter ed-sp-stack">
      {ladder.batches.length > 0 && (
        <p className="ed-text-sm ed-muted">
          Batches:{" "}
          {ladder.batches.map((b) => `${b.batch_name} (${b.level_start ?? "?"}–${b.level_end ?? "?"})`).join(" · ")}
        </p>
      )}
      {ladder.curriculum_ladder.levels.length === 0 ? (
        <StudentEmptyState
          title="Levels not published yet"
          text="Your center is setting up this curriculum. Level steps will appear here once published."
        />
      ) : (
        <CurriculumLadder
          levels={ladder.curriculum_ladder.levels}
          completionPct={ladder.curriculum_ladder.completion_pct}
          curriculumLabel={ladder.curriculum_label}
        />
      )}
      <SectionCard title="Assessment history">
        {ladder.assessments.length === 0 ? (
          <p className="ed-text-sm ed-muted">No exams recorded yet — scores appear here after assessments.</p>
        ) : (
          ladder.assessments.map((a) => (
            <div key={a.id} className="ed-sp-assessment ed-ops-animate-in">
              <div>
                <p className="ed-sp-ladder__step-name">{a.assessment_type}</p>
                <p className="ed-sp-timeline__time">{formatShortDate(a.assessed_at)}</p>
                {a.notes ? <p className="ed-text-sm ed-muted">{a.notes}</p> : null}
              </div>
              <span className="ed-sp-assessment__score">
                {a.score ?? "—"}
                {a.max_score != null ? `/${a.max_score}` : ""}
              </span>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}

export function StudentProgressPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const progress = useQuery({
    queryKey: ["student-program-ladders", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentProgramLadders(brandId!),
    retry: shouldRetryStudentLearnQuery,
  });

  if (progress.isLoading) {
    return (
      <>
        <PageTitle>Progress</PageTitle>
        <StudentPortalLoading label="Loading your progress…" />
      </>
    );
  }

  if (progress.error instanceof StudentLearnRpcError) {
    if (
      progress.error.code === "NO_ACTIVE_ENROLLMENT" ||
      progress.error.code === "NO_STUDENT_LINK"
    ) {
      return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
    }
  }

  if (progress.error) {
    return (
      <>
        <PageTitle>Progress</PageTitle>
        <SectionCard title="Could not load progress">
          <p className="ed-text-sm" role="alert">
            {studentProgressErrorMessage(progress.error)}
          </p>
          <Button onClick={() => void progress.refetch()}>Try again</Button>
        </SectionCard>
      </>
    );
  }

  const ladders = progress.data ?? [];
  const emptyMessage = studentProgressEmptyMessage(ladders.length);

  if (emptyMessage) {
    return (
      <>
        <PageTitle>Progress</PageTitle>
        <SectionCard title="Your progress">
          <StudentEmptyState title="Nothing to show yet" text={emptyMessage} />
          <p className="ed-text-sm" style={{ marginTop: "1rem" }}>
            <Link to="/" className="ed-sp-section__action">
              Back to dashboard
            </Link>
            {" · "}
            <Link to="/competitions" className="ed-sp-section__action">
              View competitions
            </Link>
          </p>
        </SectionCard>
      </>
    );
  }

  const activeId = selectedId ?? ladders[0]?.curriculum_version_id ?? null;
  const active = ladders.find((l) => l.curriculum_version_id === activeId) ?? null;

  return (
    <>
      <PageTitle>Progress</PageTitle>
      <div className="ed-sp-master-detail ed-sp-stack">
        <PipelineMasterDetail
          list={
            <SectionCard title="Your programs">
              <LadderList ladders={ladders} selectedId={activeId} onSelect={setSelectedId} />
            </SectionCard>
          }
          detail={
            active ? (
              <SectionCard title={active.program_name}>
                <LadderDetail ladder={active} />
              </SectionCard>
            ) : (
              <SectionCard title="Program detail">
                <PipelineDetailPlaceholder message="Select a program to view your ladder and assessment history." />
              </SectionCard>
            )
          }
        />
      </div>
    </>
  );
}
