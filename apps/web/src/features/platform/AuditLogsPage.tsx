import { useQuery } from "@tanstack/react-query";
import { Card, DataList, ListRow, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export function AuditLogsPage() {
  const logs = useQuery({
    queryKey: ["platform-audit"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return supabaseList(data, qErr) as AuditLog[];
    },
  });

  return (
    <>
      <PageTitle>Audit Logs</PageTitle>
      <p className="ed-text-sm ed-muted">Append-only system events. Entries cannot be edited from the admin UI.</p>
      <Card title="Recent events">
        <DataList
          items={logs.data ?? []}
          empty="No audit events."
          render={(l) => (
            <ListRow>
              <span>
                {l.action} on {l.resource_type}
                {l.resource_id ? ` (${l.resource_id.slice(0, 8)}…)` : ""} — {new Date(l.created_at).toLocaleString()}
              </span>
            </ListRow>
          )}
        />
      </Card>
    </>
  );
}
