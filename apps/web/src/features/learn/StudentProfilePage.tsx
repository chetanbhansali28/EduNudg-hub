import { useQuery } from "@tanstack/react-query";
import { Button, PageTitle } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CenterInfoCard } from "@/features/learn/components/CenterInfoCard";
import { StudentProfileEditForm } from "@/features/learn/components/StudentProfileEditForm";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { StudentLearnRpcError, fetchStudentProfile } from "@/lib/studentLearnApi";
import { displayUserFromAuth } from "@/lib/portalUser";

export function StudentProfilePage() {
  const { user } = useAuth();
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const authProfile = displayUserFromAuth(user);

  const profile = useQuery({
    queryKey: ["student-profile", brandId],
    enabled: !!brandId,
    queryFn: () => fetchStudentProfile(brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
  });

  if (profile.error instanceof StudentLearnRpcError) {
    return <StudentEnrollmentBlockedPage brandName={tenant.brandSlug} />;
  }

  return (
    <>
      <PageTitle>Profile</PageTitle>
      <div className="ed-sp-stack ed-sp-profile-page">
        <header className="ed-sp-profile-page__header">
          <h1 className="ed-sp-profile-page__title">Profile</h1>
          <p className="ed-sp-profile-page__subtitle">
            Keep your photo and contact details current for your center and competitions.
          </p>
        </header>

        {profile.isLoading && <StudentPortalLoading label="Loading your details…" />}

        {profile.error && (
          <SectionCard title="Something went wrong">
            <p>{profile.error.message}</p>
            <Button onClick={() => void profile.refetch()}>Retry</Button>
          </SectionCard>
        )}

        {profile.data && (
          <div className="ed-sp-profile-page__layout">
            <SectionCard title="Student Details" className="ed-sp-section--profile">
              <StudentProfileEditForm
                brandId={brandId!}
                student={profile.data.student}
                email={authProfile.email}
              />
            </SectionCard>

            <SectionCard title="My center" className="ed-sp-section--profile-side">
              <CenterInfoCard center={profile.data.center} enrollment={profile.data.enrollment} />
            </SectionCard>
          </div>
        )}
      </div>
    </>
  );
}
