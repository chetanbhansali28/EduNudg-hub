import { useQuery } from "@tanstack/react-query";
import { Button, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { ActivityTimeline } from "@/features/learn/components/ActivityTimeline";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { StudentLearnRpcError, fetchStudentLearnHome } from "@/lib/studentLearnApi";

export function StudentActivityPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;

  const home = useQuery({
    queryKey: ["student-learn-home", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentLearnHome(brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
  });

  if (home.isLoading) {
    return (
      <>
        <PageTitle>Activity</PageTitle>
        <StudentPortalLoading label="Loading your timeline…" />
      </>
    );
  }

  if (home.error instanceof StudentLearnRpcError) {
    return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
  }

  if (home.error) {
    return (
      <>
        <PageTitle>Activity</PageTitle>
        <SectionCard title="Something went wrong">
          <Button onClick={() => void home.refetch()}>Retry</Button>
        </SectionCard>
      </>
    );
  }

  const activity = home.data?.recent_activity ?? [];

  return (
    <>
      <PageTitle>Activity</PageTitle>
      <div className="ed-sp-stack">
        <SectionCard title="Your timeline">
          <ActivityTimeline events={activity} />
        </SectionCard>
      </div>
    </>
  );
}
