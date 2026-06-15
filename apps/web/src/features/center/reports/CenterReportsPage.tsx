import { useQuery } from "@tanstack/react-query";
import { Card, PageGrid, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterOpsReport } from "@/lib/centerReportsApi";

export function CenterReportsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;

  const report = useQuery({
    queryKey: ["center-ops-report", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterOpsReport(centerId!),
  });

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const data = report.data;

  return (
    <>
      <PageTitle>Reports</PageTitle>
      <p className="ed-text-sm ed-muted">Auto-computed center operations summary (last 30 days where noted).</p>

      <PageGrid cols={2}>
        <Card title="Pipeline">
          <ul className="ed-text-sm">
            <li>Open leads: {data?.open_leads ?? "—"}</li>
            <li>Converted leads: {data?.converted_leads ?? "—"}</li>
            <li>Active enrollments: {data?.active_enrollments ?? "—"}</li>
          </ul>
        </Card>
        <Card title="Activity (30 days)">
          <ul className="ed-text-sm">
            <li>Assessments recorded: {data?.assessments_30d ?? "—"}</li>
          </ul>
        </Card>
      </PageGrid>

      <Card title="Recent assessments">
        {(data?.recent_assessments ?? []).length > 0 ? (
          <ul>
            {data!.recent_assessments.map((a, i) => (
              <li key={`${a.student_name}-${a.assessed_at}-${i}`}>
                <strong>{a.student_name}</strong>
                <div className="ed-text-sm ed-muted">
                  {a.assessment_type} · {a.assessed_at}
                  {a.score != null ? ` · ${a.score}${a.max_score != null ? ` / ${a.max_score}` : ""}` : ""}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ed-empty">No assessments in report window.</p>
        )}
      </Card>
    </>
  );
}
