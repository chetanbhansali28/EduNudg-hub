import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";

export interface BrandMonitoringStats {
  centersTotal: number;
  centersActive: number;
  students: number;
  enrollmentsActive: number;
  leadsOpen: number;
  revenue30dCents: number;
  enrollments30d: number;
  unpaidInvoices: number;
  unpaidAmountCents: number;
  recentDaily: {
    id: string;
    metric_date: string;
    enrollments_count: number;
    revenue_cents: number;
    active_centers: number;
  }[];
  topCenters: {
    id: string;
    name: string;
    slug: string;
    enrollments30d: number;
    fees30dCents: number;
  }[];
}

function thirtyDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export function useBrandMonitoringStats(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-monitoring", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<BrandMonitoringStats> => {
      const supabase = getSupabase();
      const since = thirtyDaysAgoIso();

      const [
        centersRes,
        studentsRes,
        enrollmentsRes,
        leadsRes,
        analyticsRes,
        invoicesRes,
        centerMetricsRes,
      ] = await Promise.all([
        supabase.from("franchise_centers").select("id, slug, name, status").eq("brand_id", brandId!).is("deleted_at", null),
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .is("deleted_at", null),
        supabase
          .from("student_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .eq("status", "active"),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", brandId!)
          .in("status", ["new", "contacted", "qualified"]),
        supabase
          .from("analytics_daily_brand")
          .select("id, metric_date, enrollments_count, revenue_cents, active_centers")
          .eq("brand_id", brandId!)
          .gte("metric_date", since)
          .order("metric_date", { ascending: false }),
        supabase
          .from("platform_invoices")
          .select("amount_cents, status")
          .eq("brand_id", brandId!)
          .in("status", ["draft", "sent", "overdue", "partial"]),
        supabase
          .from("analytics_daily_center")
          .select("center_id, enrollments_count, fees_collected_cents, franchise_centers(name, slug)")
          .eq("brand_id", brandId!)
          .gte("metric_date", since),
      ]);

      const centers = centersRes.data ?? [];
      const daily = analyticsRes.data ?? [];
      const revenue30dCents = daily.reduce((s, r) => s + (r.revenue_cents ?? 0), 0);
      const enrollments30d = daily.reduce((s, r) => s + (r.enrollments_count ?? 0), 0);
      const invoices = invoicesRes.data ?? [];

      const centerAgg = new Map<string, { name: string; slug: string; enrollments30d: number; fees30dCents: number }>();
      for (const row of centerMetricsRes.data ?? []) {
        const fc = row.franchise_centers as { name: string; slug: string } | null;
        const cid = row.center_id as string;
        const cur = centerAgg.get(cid) ?? {
          name: fc?.name ?? "Center",
          slug: fc?.slug ?? "",
          enrollments30d: 0,
          fees30dCents: 0,
        };
        cur.enrollments30d += row.enrollments_count ?? 0;
        cur.fees30dCents += row.fees_collected_cents ?? 0;
        centerAgg.set(cid, cur);
      }

      const topCenters = [...centerAgg.entries()]
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.enrollments30d - a.enrollments30d)
        .slice(0, 5);

      return {
        centersTotal: centers.length,
        centersActive: centers.filter((c) => c.status === "active").length,
        students: studentsRes.count ?? 0,
        enrollmentsActive: enrollmentsRes.count ?? 0,
        leadsOpen: leadsRes.count ?? 0,
        revenue30dCents,
        enrollments30d,
        unpaidInvoices: invoices.length,
        unpaidAmountCents: invoices.reduce((s, i) => s + (i.amount_cents ?? 0), 0),
        recentDaily: daily.slice(0, 14).map((r) => ({
          id: r.id,
          metric_date: r.metric_date,
          enrollments_count: r.enrollments_count ?? 0,
          revenue_cents: r.revenue_cents ?? 0,
          active_centers: r.active_centers ?? 0,
        })),
        topCenters,
      };
    },
  });
}

export function formatInrFromPaise(cents: number): string {
  return `₹${(cents / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
