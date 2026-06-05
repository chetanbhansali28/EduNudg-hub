import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageTitle } from "@edunudg/ui";
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

const AUDIT_EVENT_HINTS = [
  "Brand signup approved or rejected",
  "Subscription plan created, updated, or deleted",
  "Brand subscription assigned, updated, or removed",
];

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

  const items = logs.data ?? [];

  return (
    <>
      <PageTitle>Audit Logs</PageTitle>
      <p className="ed-text-sm ed-muted">
        Append-only record of platform admin actions. Entries cannot be edited from this UI.
      </p>
      <Card title="Recent events">
        {logs.isLoading ? (
          <p className="ed-text-sm ed-muted">Loading audit events…</p>
        ) : items.length === 0 ? (
          <div className="ed-empty">
            <p>No audit events yet.</p>
            <p className="ed-text-sm ed-muted" style={{ marginTop: "0.5rem" }}>
              Events appear when platform admins perform actions such as:
            </p>
            <ul className="ed-text-sm ed-muted" style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {AUDIT_EVENT_HINTS.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="ed-monitoring-table-wrap">
            <table className="ed-monitoring-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                    <td>
                      <Badge tone="default">{l.action}</Badge>
                    </td>
                    <td>
                      {l.resource_type.replace(/_/g, " ")}
                      {l.resource_id ? ` (${l.resource_id.slice(0, 8)}…)` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
