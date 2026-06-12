import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, PageGrid, PageGridFull, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { ActivityTimeline } from "@/features/learn/components/ActivityTimeline";
import { CenterInfoCard } from "@/features/learn/components/CenterInfoCard";
import { CompetitionCard } from "@/features/learn/components/CompetitionCard";
import { CurriculumLadder } from "@/features/learn/components/CurriculumLadder";
import { QuickActionStrip } from "@/features/learn/components/QuickActionStrip";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentStatStrip } from "@/features/learn/components/StudentStatStrip";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { StudentLearnRpcError, fetchStudentLearnHome } from "@/lib/studentLearnApi";
import { registerForCompetition } from "@/lib/studentCompetitionsApi";
import { formatShortDate } from "@/features/learn/studentFormatters";

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

  const enroll = useMutation({
    mutationFn: registerForCompetition,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] }),
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

  const { center, enrollment, curriculum_ladder, stats } = data;
  const hasCurriculum = !!enrollment.curriculum_version_id;

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
                hint: hasCurriculum ? `${curriculum_ladder.completion_pct}% complete` : undefined,
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

        <PageGrid cols={2}>
          <SectionCard title="My center">
            <CenterInfoCard center={center} enrollment={enrollment} />
          </SectionCard>

          <SectionCard title="Your learning path" action={{ label: "Full progress", to: "/progress" }}>
            {hasCurriculum ? (
              <CurriculumLadder
                levels={curriculum_ladder.levels}
                completionPct={curriculum_ladder.completion_pct}
                curriculumLabel={enrollment.curriculum_version_label}
                limit={4}
                progressLink="/progress"
              />
            ) : (
              <p className="ed-text-sm ed-muted">
                Your center has not assigned a curriculum yet. Contact {center.display_name}
                {center.contact_phone ? ` at ${center.contact_phone}` : ""}.
              </p>
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
                  statusTag={
                    c.my_registration_status !== "none" ? c.my_registration_status : undefined
                  }
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

          <SectionCard title="Recent activity" action={{ label: "Full timeline", to: "/activity" }}>
            <ActivityTimeline events={data.recent_activity.slice(0, 5)} />
          </SectionCard>

          {data.recent_results.length > 0 && (
            <SectionCard title="Recent results">
              <ul className="ed-sp-timeline">
                {data.recent_results.map((r, i) => (
                  <li key={`${r.competition_name}-${i}`} className="ed-sp-timeline__item">
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

          {data.my_registrations.length > 0 && (
            <SectionCard title="My registrations">
              <ul className="ed-sp-timeline">
                {data.my_registrations.map((r) => (
                  <li key={r.registration_id} className="ed-sp-timeline__item">
                    <span className="ed-sp-timeline__icon" aria-hidden>
                      EV
                    </span>
                    <div>
                      <p className="ed-sp-timeline__title">{r.name}</p>
                      <p className="ed-sp-timeline__sub">{r.status.replace("_", " ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <PageGridFull>
            <SectionCard title="Quick shortcuts">
              <QuickActionStrip actions={data.quick_actions} />
            </SectionCard>
          </PageGridFull>
        </PageGrid>
      </div>
    </>
  );
}
