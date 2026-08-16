import { getSupabase } from "@/lib/supabase";
import { formatInrFromPaise as formatInrFromPaiseShared } from "@/lib/inrCurrency";

export const ANALYTICS_TIMEZONE = "Asia/Kolkata";
export const ANALYTICS_TREND_DAYS = 60;
export const ANALYTICS_KPI_DAYS = 30;

const NEW_ENROLLMENT_STATUSES = ["active", "completed", "transferred"] as const;

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
  royaltyPendingCents: number;
  recentDaily: BrandDailyTrendRow[];
  topCenters: BrandCenterRanking[];
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Calendar YYYY-MM-DD in the analytics timezone (IST). */
export function calendarDayKey(value: string | Date, timeZone = ANALYTICS_TIMEZONE): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(isoDate: string, delta: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + delta));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

export function daysAgoDate(days: number, now = new Date(), timeZone = ANALYTICS_TIMEZONE): string {
  return addCalendarDays(calendarDayKey(now, timeZone), -days);
}

export function thirtyDaysAgoDate(now = new Date()): string {
  return daysAgoDate(ANALYTICS_KPI_DAYS, now);
}

/** Groups enrollment timestamps into IST date buckets (YYYY-MM-DD). */
export function groupEnrollmentsByDate(
  rows: { enrolled_at: string }[],
  sinceDate: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const day = calendarDayKey(row.enrolled_at);
    if (!day || day < sinceDate) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

export function groupEnrollmentCentersByDate(
  rows: { enrolled_at: string; center_id: string | null }[],
  sinceDate: string
): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const row of rows) {
    const day = calendarDayKey(row.enrolled_at);
    if (!day || day < sinceDate || !row.center_id) continue;
    const bucket = sets.get(day) ?? new Set<string>();
    bucket.add(row.center_id);
    sets.set(day, bucket);
  }
  return new Map([...sets.entries()].map(([day, ids]) => [day, ids.size]));
}

export function paidRoyaltyDay(row: { updated_at?: string | null; period_end?: string | null }): string {
  if (row.updated_at) return calendarDayKey(row.updated_at);
  if (row.period_end) return String(row.period_end).slice(0, 10);
  return "";
}

/** Last N calendar days in IST (inclusive of today), newest first. */
export function recentDayKeys(days: number, now = new Date(), timeZone = ANALYTICS_TIMEZONE): string[] {
  const today = calendarDayKey(now, timeZone);
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    keys.push(addCalendarDays(today, -i));
  }
  return keys;
}

export function sumMapInWindow(values: Map<string, number>, sinceDate: string, untilDate: string): number {
  let total = 0;
  for (const [day, amount] of values) {
    if (day >= sinceDate && day <= untilDate) total += amount;
  }
  return total;
}

export function buildDailyTrend(
  enrollmentCounts: Map<string, number>,
  revenueByDate: Map<string, number>,
  centersByDate: Map<string, number>,
  dayCount = 14,
  now = new Date()
): BrandDailyTrendRow[] {
  return recentDayKeys(dayCount, now).map((metric_date) => ({
    metric_date,
    enrollments_count: enrollmentCounts.get(metric_date) ?? 0,
    revenue_cents: revenueByDate.get(metric_date) ?? 0,
    active_centers: centersByDate.get(metric_date) ?? 0,
  }));
}

export async function fetchBrandAnalyticsStats(brandId: string, now = new Date()): Promise<BrandAnalyticsStats> {
  const supabase = getSupabase();
  const sinceTrend = daysAgoDate(ANALYTICS_TREND_DAYS, now);
  const sinceKpi = daysAgoDate(ANALYTICS_KPI_DAYS, now);
  const today = calendarDayKey(now);

  const [
    centersRes,
    studentsRes,
    enrollmentsActiveRes,
    leadsRes,
    enrollmentsRes,
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
      .in("status", [...NEW_ENROLLMENT_STATUSES])
      .gte("enrolled_at", `${sinceTrend}T00:00:00+05:30`),
    supabase.from("royalty_settlements").select("amount_cents, period_end, updated_at, status, center_id").eq("brand_id", brandId),
    supabase
      .from("platform_invoices")
      .select("amount_cents, status")
      .eq("brand_id", brandId)
      .in("status", ["draft", "sent", "overdue", "partial"]),
  ]);

  const centers = centersRes.data ?? [];
  const centersActive = centers.filter((c) => c.status === "active").length;
  const centerById = new Map(centers.map((c) => [c.id, c]));

  const enrollmentRows = enrollmentsRes.data ?? [];
  const enrollmentByDate = groupEnrollmentsByDate(enrollmentRows, sinceTrend);
  const centersByDate = groupEnrollmentCentersByDate(enrollmentRows, sinceTrend);

  const revenueByDate = new Map<string, number>();
  let royaltyPendingCents = 0;
  for (const row of royaltiesRes.data ?? []) {
    const amount = row.amount_cents ?? 0;
    if (row.status !== "paid") {
      royaltyPendingCents += amount;
      continue;
    }
    const day = paidRoyaltyDay(row);
    if (!day || day < sinceTrend) continue;
    revenueByDate.set(day, (revenueByDate.get(day) ?? 0) + amount);
  }

  const enrollments30d = sumMapInWindow(enrollmentByDate, sinceKpi, today);
  const revenue30dCents = sumMapInWindow(revenueByDate, sinceKpi, today);

  const centerAgg = new Map<string, BrandCenterRanking>();
  for (const row of enrollmentRows) {
    const day = calendarDayKey(row.enrolled_at);
    if (!day || day < sinceKpi) continue;
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
    royaltyPendingCents,
    recentDaily: buildDailyTrend(enrollmentByDate, revenueByDate, centersByDate, ANALYTICS_TREND_DAYS, now),
    topCenters,
  };
}

export function formatInrFromPaise(cents: number): string {
  return formatInrFromPaiseShared(cents);
}
