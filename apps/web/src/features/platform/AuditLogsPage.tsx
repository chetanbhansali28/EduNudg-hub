import { useQuery } from "@tanstack/react-query";
import { fetchPlatformAuditLogs } from "@/lib/platformAuditApi";
import { AuditLogsPageView } from "./AuditLogsPageView";

export function AuditLogsPage() {
  const logs = useQuery({
    queryKey: ["platform-audit"],
    queryFn: fetchPlatformAuditLogs,
  });

  return <AuditLogsPageView logs={logs.data ?? []} loading={logs.isLoading} />;
}
