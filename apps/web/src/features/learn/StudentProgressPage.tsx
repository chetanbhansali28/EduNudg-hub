import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { LearningPathTimelineMulti } from "@/features/learn/components/LearningPathTimeline";
import {
  SectionCard,
  StudentPageHeading,
  StudentEmptyState,
  StudentPortalLoading,
} from "@/features/learn/components/StudentPortalShell";
import { StudentProgressHeroCard } from "@/features/learn/components/StudentProgressHeroCard";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { assessmentResultLabel, formatShortDate } from "@/features/learn/studentFormatters";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";
import {
  shouldRetryStudentLearnQuery,
  studentProgressEmptyMessage,
  studentProgressErrorMessage,
} from "@/lib/studentLearnErrors";
import { fetchStudentProgramLadders } from "@/lib/studentProgressApi";

export function StudentProgressPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;

  const progress = useQuery({
    queryKey: ["student-program-ladders", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentProgramLadders(brandId!),
    retry: shouldRetryStudentLearnQuery,
  });

  if (progress.isLoading) {
    return <StudentPortalLoading label="Loading your progress…" />;
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
      <SectionCard title="Could not load progress">
        <p className="ed-text-sm" role="alert">
          {studentProgressErrorMessage(progress.error)}
        </p>
        <Button onClick={() => void progress.refetch()}>Try again</Button>
      </SectionCard>
    );
  }

  const ladders = progress.data ?? [];
  const emptyMessage = studentProgressEmptyMessage(ladders.length);
  const assessmentSections = ladders.filter((l) => l.assessments.length > 0);

  if (emptyMessage) {
    return (
      <>
        <StudentPageHeading title="Progress" subtitle="Track your levels and assessment history." />
        <SectionCard title="Your progress">
          <StudentEmptyState title="Nothing to show yet" text={emptyMessage} />
          <p className="ed-text-sm ed-sp-inline-links">
            <Link to="/" className="ed-sp-section__action">
              Back to home
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

  return (
    <div className="ed-sp-stack ed-sp-layout-progress">
      <StudentPageHeading title="Progress" subtitle="Your program levels and exam history." />

      <StudentProgressHeroCard ladders={ladders} showContinueCta={false} />

      <div className="ed-sp-layout-progress__grid">
        <SectionCard title="Your learning path">
          <LearningPathTimelineMulti ladders={ladders} />
        </SectionCard>

        {assessmentSections.length > 0 && (
          <div className="ed-sp-stack">
            {assessmentSections.map((ladder) => (
              <SectionCard key={ladder.program_id} title={`Assessments · ${ladder.program_name}`}>
                <div className="ed-sp-layout-progress__assessments">
                  {ladder.assessments.map((a) => (
                    <div key={a.id} className="ed-sp-assessment ed-sp-assessment--card">
                      <div>
                        <p className="ed-sp-assessment__title">
                          {a.level_name ? `${a.level_name} · ` : ""}
                          {a.assessment_type}
                        </p>
                        <p className="ed-sp-assessment__date">{formatShortDate(a.assessed_at)}</p>
                        {a.passed != null && assessmentResultLabel(a.passed) && (
                          <span
                            className={`ed-sp-assessment__pass${a.passed ? " ed-sp-assessment__pass--yes" : " ed-sp-assessment__pass--no"}`}
                          >
                            {assessmentResultLabel(a.passed)}
                          </span>
                        )}
                        {a.notes ? <p className="ed-text-sm ed-muted">{a.notes}</p> : null}
                      </div>
                      <span className="ed-sp-assessment__score">
                        {a.score ?? "—"}
                        {a.max_score != null ? `/${a.max_score}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
