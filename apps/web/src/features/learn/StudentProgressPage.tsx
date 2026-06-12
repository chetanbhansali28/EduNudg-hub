import { useQuery } from "@tanstack/react-query";
import { Button, PageGrid, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CurriculumLadder } from "@/features/learn/components/CurriculumLadder";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { formatShortDate } from "@/features/learn/studentFormatters";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";
import { fetchStudentProgressDetail } from "@/lib/studentProgressApi";

export function StudentProgressPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;

  const progress = useQuery({
    queryKey: ["student-progress-detail", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentProgressDetail(brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
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
    return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
  }

  if (progress.error) {
    return (
      <>
        <PageTitle>Progress</PageTitle>
        <SectionCard title="Something went wrong">
          <p>{progress.error.message}</p>
          <Button onClick={() => void progress.refetch()}>Retry</Button>
        </SectionCard>
      </>
    );
  }

  const data = progress.data;
  if (!data) return null;

  return (
    <>
      <PageTitle>Progress</PageTitle>
      <div className="ed-sp-stack">
        <PageGrid cols={2}>
          <SectionCard title="Curriculum ladder">
            <CurriculumLadder
              levels={data.curriculum_ladder.levels}
              completionPct={data.curriculum_ladder.completion_pct}
            />
          </SectionCard>

          <SectionCard title="Exam & assessment history">
            {data.assessments.length === 0 ? (
              <p className="ed-text-sm ed-muted">No exams recorded yet — your scores will appear here after assessments.</p>
            ) : (
              data.assessments.map((a) => (
                <div key={a.id} className="ed-sp-assessment">
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
        </PageGrid>
      </div>
    </>
  );
}
