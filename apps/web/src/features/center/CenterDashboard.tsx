import { useQuery } from "@tanstack/react-query";
import { KpiCard, KpiGrid, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { useTenant } from "@/bootstrap/TenantProvider";

export function CenterDashboard() {
  const tenant = useTenant();
  const centerId = tenant.centerId;

  const openLeads = useQuery({
    queryKey: ["center-open-leads-count", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { count, error } = await getSupabase()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("center_id", centerId!)
        .in("status", ["new", "contacted", "qualified"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <>
      <PageTitle>Operations Dashboard</PageTitle>
      <KpiGrid>
        <KpiCard label="Today's batches" value="—" />
        <KpiCard label="Attendance (7d)" value="—" />
        <KpiCard label="Open leads" value={openLeads.isLoading ? "…" : String(openLeads.data ?? 0)} />
        <KpiCard label="Fee collection" value="—" />
      </KpiGrid>
    </>
  );
}
