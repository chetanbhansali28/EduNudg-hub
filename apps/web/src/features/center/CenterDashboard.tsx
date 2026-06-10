import { useQuery } from "@tanstack/react-query";
import { KpiCard, KpiGrid, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { fetchCenterDashboardStats } from "@/lib/centerDashboardStats";

export function CenterDashboard() {
  const tenant = useTenant();
  const centerId = tenant.centerId;

  const stats = useQuery({
    queryKey: ["center-dashboard", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterDashboardStats(centerId!),
  });

  const s = stats.data;

  return (
    <>
      <PageTitle>Operations Dashboard</PageTitle>
      {stats.isLoading ? (
        <p className="ed-text-sm ed-muted">Loading KPIs…</p>
      ) : (
        <KpiGrid>
          <KpiCard label="Active batches" value={s?.batchCount ?? "—"} hint={`${s?.sessionsToday ?? 0} sessions today`} />
          <KpiCard
            label="Attendance (7d)"
            value={s?.attendanceRate7d != null ? `${s.attendanceRate7d}%` : "—"}
            hint="Present / marked"
          />
          <KpiCard label="Open leads" value={s?.openLeads ?? "—"} />
          <KpiCard
            label="Ready to convert"
            value={s?.pendingConversion ?? "—"}
            hint="Qualified leads"
          />
          <KpiCard label="Active enrollments" value={s?.activeEnrollments ?? "—"} />
          <KpiCard
            label="Fee collection"
            value={s?.feeCollectionRate != null ? `${s.feeCollectionRate}%` : "—"}
            hint={
              s && s.overdueFeesCents > 0
                ? `${formatInrFromPaise(s.overdueFeesCents)} overdue`
                : "Paid vs billable"
            }
          />
          <KpiCard label="Low stock items" value={s?.lowStockItems ?? "—"} hint="Qty ≤ 5" />
          <KpiCard
            label="Unpaid merchandise"
            value={s?.unpaidMerchandiseCount ?? "—"}
            hint={
              s && s.unpaidMerchandiseCents > 0
                ? `${formatInrFromPaise(s.unpaidMerchandiseCents)} due${s.overdueMerchandiseCount > 0 ? ` · ${s.overdueMerchandiseCount} overdue` : ""}`
                : "Orders awaiting payment"
            }
          />
        </KpiGrid>
      )}
    </>
  );
}
