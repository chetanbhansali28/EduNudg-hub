import { useQuery } from "@tanstack/react-query";
import { Card, DataList, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function AttendancePage() {
  const tenant = useTenant();
  const sessions = useQuery({
    queryKey: ["attendance-sessions", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("attendance_sessions").select("id, session_date, batch_id");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  return (
    <>
      <PageTitle>Attendance</PageTitle>
      <Card>
        <DataList
          items={(sessions.data ?? []).map((s) => (s))}
          empty="No sessions scheduled."
          render={(s) => <span>Session {s.session_date}</span>}
        />
      </Card>
    </>
  );
}
