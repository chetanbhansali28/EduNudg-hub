import { useQuery } from "@tanstack/react-query";
import { KpiCard, KpiGrid, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";

export function CommandCenter() {
  const stats = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const supabase = getSupabase();
      const [brands, centers, plans] = await Promise.all([
        supabase.from("brands").select("id, status", { count: "exact" }),
        supabase.from("franchise_centers").select("id", { count: "exact" }),
        supabase.from("subscription_plans").select("id", { count: "exact" }),
      ]);
      const active = brands.data?.filter((b: { status: string }) => b.status === "active").length ?? 0;
      return {
        totalBrands: brands.count ?? brands.data?.length ?? 0,
        activeBrands: active,
        totalCenters: centers.count ?? 0,
        plans: plans.count ?? 0,
      };
    },
  });

  const s = stats.data ?? { totalBrands: 0, activeBrands: 0, totalCenters: 0, plans: 0 };

  return (
    <>
      <PageTitle>Executive Command Center</PageTitle>
      <KpiGrid>
        <KpiCard label="Active brands" value={s.activeBrands} hint={`${s.totalBrands} total`} />
        <KpiCard label="Franchise centers" value={s.totalCenters} />
        <KpiCard label="Subscription plans" value={s.plans} />
        <KpiCard label="MRR (stub)" value="—" hint="Connect billing" />
      </KpiGrid>
    </>
  );
}
