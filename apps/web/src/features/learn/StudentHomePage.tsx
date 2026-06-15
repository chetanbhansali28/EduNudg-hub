import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, MutationError } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { BatchJoinCarousel } from "@/features/learn/components/BatchJoinCarousel";
import { JoinBatchPromoCard } from "@/features/learn/components/JoinBatchPromoCard";
import { LearningPathPanel } from "@/features/learn/components/LearningPathPanel";
import { LearningPathTimeline } from "@/features/learn/components/LearningPathTimeline";
import { RecommendedEventCard } from "@/features/learn/components/RecommendedEventCard";
import { StudentMobileProgressCard } from "@/features/learn/components/StudentMobileProgressCard";
import {
  SectionCard,
  StudentPageWelcome,
  StudentPortalLoading,
} from "@/features/learn/components/StudentPortalShell";
import { StudentProgressHeroCard } from "@/features/learn/components/StudentProgressHeroCard";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { useStudentBreakpoint } from "@/features/learn/hooks/useStudentBreakpoint";
import { StudentLearnRpcError, fetchStudentLearnHome } from "@/lib/studentLearnApi";
import { fetchStudentOpenBatches, joinStudentBatch } from "@/lib/studentBatchJoinApi";
import { fetchStudentProgramLadders } from "@/lib/studentProgressApi";

export function StudentHomePage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const qc = useQueryClient();
  const { isMobile } = useStudentBreakpoint();

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

  const joinBatch = useMutation({
    mutationFn: joinStudentBatch,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-open-batches", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-program-ladders", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] });
    },
  });

  if (home.isLoading) {
    return <StudentPortalLoading />;
  }

  if (home.error instanceof StudentLearnRpcError) {
    if (home.error.code === "NO_ACTIVE_ENROLLMENT" || home.error.code === "NO_STUDENT_LINK") {
      return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
    }
  }

  if (home.error) {
    return (
      <SectionCard title="Something went wrong">
        <p>{home.error instanceof Error ? home.error.message : "Unable to load dashboard."}</p>
        <Button onClick={() => void home.refetch()}>Retry</Button>
      </SectionCard>
    );
  }

  const data = home.data;
  if (!data) return null;

  const batches = openBatches.data ?? [];
  const ladders = programLadders.data ?? [];
  const pct = ladders[0]?.curriculum_ladder.completion_pct ?? data.curriculum_ladder.completion_pct;
  const welcomeSubtitle =
    pct > 0
      ? `You've completed ${pct}% of your current module. Keep going!`
      : "Your learning journey starts here — join a batch to begin.";

  if (isMobile) {
    return (
      <div className="ed-sp-stack ed-sp-layout-home ed-sp-layout-home--mobile">
        <StudentPageWelcome name={data.student.full_name} mobile />

        <StudentMobileProgressCard
          ladders={ladders}
          fallbackPct={data.curriculum_ladder.completion_pct}
          batchName={data.enrollment.batch_name}
        />

        {batches.length > 0 && (
          <SectionCard title="Join a batch" action={{ label: "View all", to: "/#join-batches" }} id="join-batches">
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
            <LearningPathTimeline
              ladders={ladders}
              limit={5}
              progressLink="/progress"
              completionPct={pct}
            />
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="ed-sp-stack ed-sp-layout-home ed-sp-layout-home--desktop">
      <StudentPageWelcome name={data.student.full_name} subtitle={welcomeSubtitle} />

      <div className="ed-sp-layout-home__dashboard">
        <div className="ed-sp-layout-home__left">
          <StudentProgressHeroCard
            ladders={ladders}
            fallbackPct={data.curriculum_ladder.completion_pct}
            levelsCompleted={data.stats.levels_completed}
            levelsTotal={data.stats.levels_total}
            assessmentsCount={data.stats.assessments_count}
            avgScorePct={data.stats.avg_score_pct}
          />
          <JoinBatchPromoCard
            batchCount={batches.filter((b) => !b.already_joined).length}
            programName={data.enrollment.program_name}
          />
        </div>

        <SectionCard
          title="Your Learning Path"
          panel
          className="ed-sp-layout-home__path"
          action={{ label: "Full Roadmap →", to: "/progress" }}
        >
          <LearningPathPanel
            ladders={ladders}
            assessments={ladders[0]?.assessments ?? []}
            recentResults={data.recent_results}
            stats={data.stats}
            completionPct={pct}
            loading={programLadders.isLoading}
            error={!!programLadders.error}
          />
        </SectionCard>
      </div>

      <SectionCard title="Recommended for You">
        {data.upcoming_competitions.length === 0 ? (
          <p className="ed-text-sm ed-muted">No upcoming events right now — check back soon!</p>
        ) : (
          <div className="ed-sp-recommend-grid ed-sp-recommend-grid--desktop">
            {data.upcoming_competitions.slice(0, 4).map((c, i) => (
              <RecommendedEventCard
                key={c.id}
                name={c.name}
                eventDate={c.event_date}
                location={c.location}
                feeType={c.fee_type}
                statusTag={c.my_registration_status !== "none" ? c.my_registration_status : undefined}
                accentIndex={i}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
