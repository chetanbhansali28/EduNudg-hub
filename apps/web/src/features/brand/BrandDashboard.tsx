import { useQuery } from "@tanstack/react-query";
import { KpiCard, KpiGrid, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { useBrandScope } from "./hooks/useBrandScope";

export function BrandDashboard() {
  const { brandId, missingBrand } = useBrandScope();

  const stats = useQuery({
    queryKey: ["brand-dashboard", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const sb = getSupabase();
      const nowIso = new Date().toISOString();
      const [centers, programs, inquiries, settlements, unassignedLeads, staleLeads] = await Promise.all([
        sb
          .from("franchise_centers")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .eq("status", "active")
          .is("deleted_at", null),
        sb
          .from("programs")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .is("deleted_at", null),
        sb
          .from("franchise_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .eq("status", "new"),
        sb
          .from("royalty_settlements")
          .select("amount_cents")
          .eq("brand_id", brandId!)
          .eq("status", "pending"),
        sb
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .is("center_id", null)
          .not("status", "in", '("converted","lost")'),
        sb
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .not("center_id", "is", null)
          .lt("stale_at", nowIso)
          .not("status", "in", '("converted","lost")'),
      ]);

      const royaltyDue = (settlements.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      const versions = await sb
        .from("curriculum_versions")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", brandId!)
        .eq("status", "draft");

      return {
        activeCenters: centers.count ?? 0,
        programs: programs.count ?? 0,
        newInquiries: inquiries.count ?? 0,
        unassignedLeads: unassignedLeads.count ?? 0,
        staleLeads: staleLeads.count ?? 0,
        royaltyDue,
        draftVersions: versions.count ?? 0,
      };
    },
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const s = stats.data;

  return (
    <>
      <PageTitle>Executive Dashboard</PageTitle>
      <KpiGrid>
        <KpiCard label="Active centers" value={s?.activeCenters ?? "—"} />
        <KpiCard label="Programs" value={s?.programs ?? "—"} />
        <KpiCard label="New franchise applications" value={s?.newInquiries ?? "—"} />
        <KpiCard label="Unassigned student leads" value={s?.unassignedLeads ?? "—"} />
        <KpiCard label="Stale leads (SLA)" value={s?.staleLeads ?? "—"} />
        <KpiCard
          label="Royalty due (pending)"
          value={s != null ? `₹${(s.royaltyDue / 100).toLocaleString()}` : "—"}
        />
        <KpiCard label="Curriculum drafts" value={s?.draftVersions ?? "—"} />
      </KpiGrid>
    </>
  );
}
