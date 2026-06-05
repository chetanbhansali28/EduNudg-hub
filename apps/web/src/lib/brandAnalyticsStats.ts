import { getSupabase } from "@/lib/supabase";
import { formatInrFromPaise as formatInrFromPaiseShared } from "@/lib/inrCurrency";

export interface BrandDailyTrendRow {
  metric_date: string;
  enrollments_count: number;
  revenue_cents: number;
  active_centers: number;
}

export interface BrandCenterRanking {
  id: string;
  name: string;
  slug: string;
  enrollments30d: number;
  fees30dCents: number;
}

export interface BrandAnalyticsStats {
  centersTotal: number;
  centersActive: number;
  students: number;
  enrollmentsActive: number;
  leadsOpen: number;
  revenue30dCents: number;
  enrollments30d: number;
  unpaidInvoices: number;
  unpaidAmountCents: number;
  recentDaily: BrandDailyTrendRow[];
  topCenters: BrandCenterRanking[];
}

export function thirtyDaysAgoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

/** Groups enrollment timestamps into UTC date buckets (YYYY-MM-DD). */
export function groupEnrollmentsByDate(
  rows: { enrolled_at: string }[],
  sinceDate: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const day = row.enrolled_at.slice(0, 10);
    if (day < sinceDate) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

/** Last N calendar days (inclusive of today), newest first. */
export function recentDayKeys(days: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  for (let i = 0; i < days; i++) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return keys;
}

export function buildDailyTrend(
  enrollmentCounts: Map<string, number>,
  revenueByDate: Map<string, number>,
  activeCenters: number,
  dayCount = 14
): BrandDailyTrendRow[] {
  return recentDayKeys(dayCount).map((metric_date) => ({
    metric_date,
    enrollments_count: enrollmentCounts.get(metric_date) ?? 0,
    revenue_cents: revenueByDate.get(metric_date) ?? 0,
    active_centers: activeCenters,
  }));
}

export async function fetchBrandAnalyticsStats(brandId: string): Promise<BrandAnalyticsStats> {
  const supabase = getSupabase();
  const since = thirtyDaysAgoDate();

  const [
    centersRes,
    studentsRes,
    enrollmentsActiveRes,
    leadsRes,
    enrollments30dRes,
    royaltiesRes,
    invoicesRes,
  ] = await Promise.all([
    supabase
      .from("franchise_centers")
      .select("id, slug, name, status")
      .eq("brand_id", brandId)
      .is("deleted_at", null),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .is("deleted_at", null),
    supabase
      .from("student_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "active"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .in("status", ["new", "contacted", "qualified"]),
    supabase
      .from("student_enrollments")
      .select("enrolled_at, center_id")
      .eq("brand_id", brandId)
      .gte("enrolled_at", `${since}T00:00:00`),
    supabase
      .from("royalty_settlements")
      .select("amount_cents, period_end, updated_at")
      .eq("brand_id", brandId)
      .eq("status", "paid")
      .gte("period_end", since),
    supabase
      .from("platform_invoices")
      .select("amount_cents, status")
      .eq("brand_id", brandId)
      .in("status", ["draft", "sent", "overdue", "partial"]),
  ]);

  const centers = centersRes.data ?? [];
  const centersActive = centers.filter((c) => c.status === "active").length;
  const centerById = new Map(centers.map((c) => [c.id, c]));

  const enrollments30dRows = enrollments30dRes.data ?? [];
  const enrollments30d = enrollments30dRows.length;
  const enrollmentByDate = groupEnrollmentsByDate(enrollments30dRows, since);

  const revenueByDate = new Map<string, number>();
  let revenue30dCents = 0;
  for (const row of royaltiesRes.data ?? []) {
    const day = (row.period_end as string).slice(0, 10);
    const amount = row.amount_cents ?? 0;
    revenue30dCents += amount;
    revenueByDate.set(day, (revenueByDate.get(day) ?? 0) + amount);
  }

  const centerAgg = new Map<string, BrandCenterRanking>();
  for (const row of enrollments30dRows) {
    const cid = row.center_id as string;
    const center = centerById.get(cid);
    const cur = centerAgg.get(cid) ?? {
      id: cid,
      name: center?.name ?? "Center",
      slug: center?.slug ?? "",
      enrollments30d: 0,
      fees30dCents: 0,
    };
    cur.enrollments30d += 1;
    centerAgg.set(cid, cur);
  }

  const topCenters = [...centerAgg.values()].sort((a, b) => b.enrollments30d - a.enrollments30d).slice(0, 5);
  const invoices = invoicesRes.data ?? [];

  return {
    centersTotal: centers.length,
    centersActive,
    students: studentsRes.count ?? 0,
    enrollmentsActive: enrollmentsActiveRes.count ?? 0,
    leadsOpen: leadsRes.count ?? 0,
    revenue30dCents,
    enrollments30d,
    unpaidInvoices: invoices.length,
    unpaidAmountCents: invoices.reduce((s, i) => s + (i.amount_cents ?? 0), 0),
    recentDaily: buildDailyTrend(enrollmentByDate, revenueByDate, centersActive),
    topCenters,
  };
}

export function formatInrFromPaise(cents: number): string {
  return formatInrFromPaiseShared(cents);
}
