import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { AuditLogsPageView } from "./AuditLogsPageView";
import type { PlatformAuditLog } from "@/lib/platformAuditHelpers";

export function AuditLogsPage() {
  const logs = useQuery({
    queryKey: ["platform-audit"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return supabaseList(data, qErr) as PlatformAuditLog[];
    },
  });

  return <AuditLogsPageView logs={logs.data ?? []} loading={logs.isLoading} />;
}
