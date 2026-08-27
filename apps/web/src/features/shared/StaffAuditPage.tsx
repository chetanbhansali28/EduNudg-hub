import { useQuery } from "@tanstack/react-query";
import { AuditLogsPageView } from "@/features/platform/AuditLogsPageView";
import { fetchTenantStaffAuditLogs } from "@/lib/platformAuditApi";
import { useTenant } from "@/bootstrap/TenantProvider";

export function StaffAuditPage() {
  const tenant = useTenant();
  const logs = useQuery({
    queryKey: ["tenant-audit-logs", tenant.portalType, tenant.brandId, tenant.centerId],
    queryFn: () => fetchTenantStaffAuditLogs(tenant),
  });
  return <AuditLogsPageView logs={logs.data ?? []} loading={logs.isLoading} variant="tenant" />;
}
