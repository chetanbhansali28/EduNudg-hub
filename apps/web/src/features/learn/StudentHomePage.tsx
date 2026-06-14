import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, MutationError, PageGridFull, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { BatchJoinCarousel } from "@/features/learn/components/BatchJoinCarousel";
import { CompetitionCard } from "@/features/learn/components/CompetitionCard";
import { LearningPathCarousel } from "@/features/learn/components/LearningPathCarousel";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentStatStrip } from "@/features/learn/components/StudentStatStrip";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { formatShortDate } from "@/features/learn/studentFormatters";
import { StudentLearnRpcError, fetchStudentLearnHome } from "@/lib/studentLearnApi";
import { registerForCompetition } from "@/lib/studentCompetitionsApi";
import { fetchStudentOpenBatches, joinStudentBatch } from "@/lib/studentBatchJoinApi";
import { fetchStudentProgramLadders } from "@/lib/studentProgressApi";
import "@/features/center/centerOps.css";

export function StudentHomePage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const qc = useQueryClient();

  const home = useQuery({
    queryKey: ["student-learn-home", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentLearnHome(brandId!),
    retry: (count, err) => {
      if (err instanceof StudentLearnRpcError) return false;
      return count < 2;
    },
  });

  const openBatches = useQuery({
    queryKey: ["student-open-batches", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentOpenBatches(brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
  });

  const programLadders = useQuery({
    queryKey: ["student-program-ladders", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentProgramLadders(brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
  });

  const enroll = useMutation({
    mutationFn: registerForCompetition,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] }),
  });

  const joinBatch = useMutation({
    mutationFn: joinStudentBatch,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-open-batches", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-program-ladders", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] });
    },
  });

  if (home.isLoading) {
    return (
      <>
        <PageTitle>Dashboard</PageTitle>
        <StudentPortalLoading />
      </>
    );
  }

  if (home.error instanceof StudentLearnRpcError) {
    if (home.error.code === "NO_ACTIVE_ENROLLMENT" || home.error.code === "NO_STUDENT_LINK") {
      return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
    }
  }

  if (home.error) {
    return (
      <>
        <PageTitle>Dashboard</PageTitle>
        <SectionCard title="Something went wrong">
          <p>{home.error instanceof Error ? home.error.message : "Unable to load dashboard."}</p>
          <Button onClick={() => void home.refetch()}>Retry</Button>
        </SectionCard>
      </>
    );
  }

  const data = home.data;
  if (!data) return null;

  const { stats } = data;
  const batches = openBatches.data ?? [];
  const ladders = programLadders.data ?? [];
  const hasLearningPath = ladders.length > 0 || stats.levels_total > 0;

  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <div className="ed-sp-stack">
        <PageGridFull>
          <StudentStatStrip
            stats={[
              {
                label: "Levels done",
                value: `${stats.levels_completed}/${stats.levels_total}`,
                hint: hasLearningPath ? "Scroll your path below" : undefined,
              },
              { label: "Exams taken", value: stats.assessments_count },
              {
                label: "Avg score",
                value: stats.avg_score_pct != null ? `${stats.avg_score_pct}%` : "—",
              },
              {
                label: "Competitions",
                value: stats.competitions_registered,
                hint: stats.competitions_completed > 0 ? `${stats.competitions_completed} completed` : undefined,
              },
            ]}
          />
        </PageGridFull>

        {batches.length > 0 && (
          <SectionCard title="Join a batch">
            <MutationError message={joinBatch.error instanceof Error ? joinBatch.error.message : null} />
            <BatchJoinCarousel
              batches={batches}
              joinPending={joinBatch.isPending}
              joiningBatchId={joinBatch.variables}
              onJoin={(batchId) => joinBatch.mutate(batchId)}
            />
          </SectionCard>
        )}

        <SectionCard title="Your learning path">
          {programLadders.isLoading ? (
            <p className="ed-text-sm ed-muted">Loading your course levels…</p>
          ) : programLadders.error ? (
            <p className="ed-text-sm ed-muted">Unable to load your learning path right now.</p>
          ) : (
            <LearningPathCarousel ladders={ladders} />
          )}
        </SectionCard>

        <SectionCard title="Upcoming competitions" action={{ label: "View all", to: "/competitions" }}>
          {data.upcoming_competitions.length === 0 ? (
            <p className="ed-text-sm ed-muted">No upcoming events right now — check back soon!</p>
          ) : (
            data.upcoming_competitions.slice(0, 3).map((c) => (
              <CompetitionCard
                key={c.id}
                name={c.name}
                eventDate={c.event_date}
                location={c.location}
                feeType={c.fee_type}
                statusTag={c.my_registration_status !== "none" ? c.my_registration_status : undefined}
                canEnroll={c.can_enroll}
                enrollBlockedReason={c.enroll_blocked_reason}
                onEnroll={() => enroll.mutate(c.id)}
                enrollPending={enroll.isPending && enroll.variables === c.id}
                enrollError={
                  enroll.isError && enroll.variables === c.id && enroll.error instanceof Error
                    ? enroll.error.message
                    : null
                }
              />
            ))
          )}
        </SectionCard>

        {data.recent_results.length > 0 && (
          <SectionCard title="Recent results">
            <ul className="ed-sp-timeline">
              {data.recent_results.map((r, i) => (
                <li key={`${r.competition_name}-${i}`} className="ed-sp-timeline__item ed-ops-animate-in">
                  <span className="ed-sp-timeline__icon" aria-hidden>
                    WIN
                  </span>
                  <div>
                    <p className="ed-sp-timeline__title">{r.competition_name}</p>
                    <p className="ed-sp-timeline__sub">
                      {r.result_rank ?? "Result posted"}
                      {r.event_date ? ` · ${formatShortDate(r.event_date)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>
    </>
  );
}
