import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageGrid, PageTitle } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMembership, primaryRole } from "@/hooks/useMembership";
import { fetchStudentLearnDashboard } from "@/lib/studentLearnApi";

export function StudentDashboardPage() {
  const { user } = useAuth();
  const tenant = useTenant();
  const { data: memberships } = useMembership();
  const role = primaryRole(memberships);
  const brandId = tenant.brandId;

  const dashboard = useQuery({
    queryKey: ["student-learn-dashboard", brandId, user?.id],
    enabled: !!brandId && !!user,
    queryFn: () => fetchStudentLearnDashboard(brandId!),
  });

  const students = dashboard.data?.students ?? [];
  const upcoming = dashboard.data?.upcoming_competitions ?? [];

  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <PageGrid>
        <Card title="Your learning">
          <p className="ed-text-sm ed-muted">
            Signed in as <Badge>{role}</Badge>. Progress and competitions from your center appear below.
          </p>
          {students.length > 0 ? (
            students.map((student) => (
              <div key={student.student_id} className="ed-form-section">
                <h3>{student.full_name}</h3>
                {student.enrollments.length > 0 && (
                  <ul className="ed-text-sm">
                    {student.enrollments.map((e) => (
                      <li key={e.enrollment_id}>
                        Active at {e.center_name}
                      </li>
                    ))}
                  </ul>
                )}
                {student.progress.length > 0 && (
                  <>
                    <h4 className="ed-text-sm">Level progress</h4>
                    <ul>
                      {student.progress.map((p, i) => (
                        <li key={`${p.level_name}-${i}`}>
                          {p.level_name} — {p.status.replace("_", " ")}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {student.competitions.length > 0 && (
                  <>
                    <h4 className="ed-text-sm">Competitions</h4>
                    <ul>
                      {student.competitions.map((c, i) => (
                        <li key={`${c.competition_name}-${i}`}>
                          {c.competition_name}
                          {c.result_rank ? ` (${c.result_rank})` : ""}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="ed-text-sm">
              No linked students yet. Ask your center to convert your enrollment and link your parent account.
            </p>
          )}
        </Card>

        {upcoming.length > 0 && (
          <Card title="Upcoming competitions">
            <ul>
              {upcoming.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>
                  <div className="ed-text-sm ed-muted">
                    {c.event_date ?? "Date TBD"}
                    {c.location ? ` · ${c.location}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </PageGrid>
    </>
  );
}
