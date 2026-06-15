import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { CenterDashboardView } from "@/features/center/dashboard/CenterDashboardView";
import { formatDashboardDate } from "@/lib/centerDashboardHelpers";
import { fetchCenterDashboardHome } from "@/lib/centerDashboardHomeApi";

export function CenterDashboard() {
  const tenant = useTenant();
  const centerId = tenant.centerId;

  const dashboard = useQuery({
    queryKey: ["center-dashboard-home", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterDashboardHome(centerId!),
  });

  if (dashboard.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading dashboard…</p>;
  }

  if (!dashboard.data) {
    return <p className="ed-empty">Dashboard data unavailable.</p>;
  }

  return <CenterDashboardView data={dashboard.data} dateLabel={formatDashboardDate(new Date())} />;
}
