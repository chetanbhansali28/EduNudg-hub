import { useQuery } from "@tanstack/react-query";
import { Badge, Button, PageGrid, PageTitle } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CenterInfoCard } from "@/features/learn/components/CenterInfoCard";
import { SectionCard, StudentPortalLoading } from "@/features/learn/components/StudentPortalShell";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { formatShortDate, studentInitials } from "@/features/learn/studentFormatters";
import { StudentLearnRpcError, fetchStudentProfile } from "@/lib/studentLearnApi";
import { displayUserFromAuth } from "@/lib/portalUser";

export function StudentProfilePage() {
  const { user } = useAuth();
  const tenant = useTenant();
  const authProfile = displayUserFromAuth(user);
  const brandId = tenant.brandId;

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
      <div className="ed-sp-stack">
        <SectionCard title="Account">
          <div className="ed-sp-profile-head">
            <span className="ed-sp-profile-head__avatar" aria-hidden>
              {studentInitials(authProfile.name)}
            </span>
            <div>
              <p className="ed-sp-profile-head__name">{authProfile.name}</p>
              {authProfile.email ? <p className="ed-sp-profile-head__meta">{authProfile.email}</p> : null}
            </div>
          </div>
        </SectionCard>

        {profile.isLoading && <StudentPortalLoading label="Loading student record…" />}

        {profile.error && (
          <SectionCard title="Something went wrong">
            <p>{profile.error.message}</p>
            <Button onClick={() => void profile.refetch()}>Retry</Button>
          </SectionCard>
        )}

        {profile.data && (
          <PageGrid cols={2}>
            <SectionCard title="Student record">
              <div className="ed-sp-profile-head">
                <span className="ed-sp-profile-head__avatar" aria-hidden>
                  {studentInitials(profile.data.student.full_name)}
                </span>
                <div>
                  <p className="ed-sp-profile-head__name">{profile.data.student.full_name}</p>
                  {profile.data.student.student_code ? (
                    <p className="ed-sp-profile-head__meta">Code: {profile.data.student.student_code}</p>
                  ) : null}
                </div>
              </div>
              {profile.data.student.date_of_birth ? (
                <p className="ed-text-sm ed-muted" style={{ marginTop: "0.85rem" }}>
                  DOB: {formatShortDate(profile.data.student.date_of_birth)}
                </p>
              ) : null}
              {profile.data.student.profile.school_name ? (
                <p className="ed-text-sm">{profile.data.student.profile.school_name}</p>
              ) : null}
              {(profile.data.student.profile.city || profile.data.student.profile.pincode) && (
                <p className="ed-text-sm ed-muted">
                  {[profile.data.student.profile.city, profile.data.student.profile.pincode]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p style={{ marginTop: "0.75rem" }}>
                <Badge>{profile.data.brand.name}</Badge>
              </p>
            </SectionCard>

            <SectionCard title="My center">
              <CenterInfoCard center={profile.data.center} enrollment={profile.data.enrollment} />
            </SectionCard>

            <SectionCard title="Enrollment">
              <p className="ed-sp-ladder__step-name">{profile.data.enrollment.status.replace("_", " ")}</p>
              <p className="ed-text-sm ed-muted">
                Enrolled {formatShortDate(profile.data.enrollment.enrolled_at)}
              </p>
              {profile.data.enrollment.curriculum_version_label && (
                <p className="ed-text-sm">{profile.data.enrollment.curriculum_version_label}</p>
              )}
              {profile.data.enrollment.batch_name && (
                <p className="ed-text-sm">Batch: {profile.data.enrollment.batch_name}</p>
              )}
            </SectionCard>

            {profile.data.enrollment_history.length > 1 && (
              <SectionCard title="Enrollment history">
                <ul className="ed-sp-timeline">
                  {profile.data.enrollment_history.map((e) => (
                    <li key={e.enrollment_id} className="ed-sp-timeline__item">
                      <span className="ed-sp-timeline__icon" aria-hidden>
                        EN
                      </span>
                      <div>
                        <p className="ed-sp-timeline__title">{e.center_name}</p>
                        <p className="ed-sp-timeline__sub">
                          {e.status} · {formatShortDate(e.enrolled_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </PageGrid>
        )}
      </div>
    </>
  );
}
