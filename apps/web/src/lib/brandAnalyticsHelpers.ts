import { addCalendarDays, type BrandAnalyticsStats, type BrandDailyTrendRow } from "@/lib/brandAnalyticsStats";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { formatCompactRelative, percentChange } from "@/lib/brandDashboardHelpers";

export type AnalyticsChartPeriod = 14 | 30;

export type AnalyticsDateRange = { from: string; to: string };

export function normalizeDateRange(from: string, to: string): AnalyticsDateRange | null {
  if (!from || !to) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

export function clampDateRange(
  range: AnalyticsDateRange,
  bounds: { min: string; max: string }
): AnalyticsDateRange {
  const from = range.from < bounds.min ? bounds.min : range.from > bounds.max ? bounds.max : range.from;
  const to = range.to > bounds.max ? bounds.max : range.to < bounds.min ? bounds.min : range.to;
  return normalizeDateRange(from, to) ?? { from: bounds.min, to: bounds.max };
}

export function availableTrendBounds(rows: BrandDailyTrendRow[]): { min: string; max: string } | null {
  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.metric_date).sort();
  return { min: dates[0]!, max: dates.at(-1)! };
}

export function inclusiveDayCount(range: AnalyticsDateRange): number {
  const from = Date.parse(`${range.from}T00:00:00Z`);
  const to = Date.parse(`${range.to}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
}

export function windowDayCount(days: AnalyticsChartPeriod, range?: AnalyticsDateRange | null): number {
  return range ? inclusiveDayCount(range) : days;
}

export type PerformanceRowStatus = "peak" | "enrolling" | "royalty" | "quiet";

export type AnalyticsActivityItem = {
  id: string;
  kind: "enrollment" | "royalty" | "audit";
  title: string;
  subtitle: string;
  value?: string;
  valueTone?: "primary" | "success";
  occurredAt: string;
  href?: string;
};

export function computeEnrollmentTrendPercent(rows: BrandDailyTrendRow[]): number | null {
  const recent = rows.slice(0, 7).reduce((sum, row) => sum + row.enrollments_count, 0);
  const prior = rows.slice(7, 14).reduce((sum, row) => sum + row.enrollments_count, 0);
  return percentChange(recent, prior);
}

export function computeRoyaltyTrendPercent(rows: BrandDailyTrendRow[]): number | null {
  const recent = rows.slice(0, 7).reduce((sum, row) => sum + row.revenue_cents, 0);
  const prior = rows.slice(7, 14).reduce((sum, row) => sum + row.revenue_cents, 0);
  return percentChange(recent, prior);
}

export function enrollmentTrendLabel(percent: number | null): string | undefined {
  if (percent == null) return undefined;
  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent}%`;
}

export function royaltyTrendLabel(percent: number | null): string | undefined {
  if (percent == null) return undefined;
  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent}%`;
}

export function centersOnboardingCount(stats: BrandAnalyticsStats): number {
  return Math.max(0, stats.centersTotal - stats.centersActive);
}

export function centersTrendLabel(stats: BrandAnalyticsStats): string | undefined {
  const pending = centersOnboardingCount(stats);
  if (pending <= 0) return undefined;
  return `+${pending} Center${pending === 1 ? "" : "s"}`;
}

export function formatEnrollmentKpiHint(stats: BrandAnalyticsStats, trendPercent: number | null): string {
  if (trendPercent == null) {
    return `${stats.enrollmentsActive} active total`;
  }
  const priorApprox = Math.round(stats.enrollments30d / (1 + trendPercent / 100));
  return `vs ${Math.max(0, priorApprox)} last period`;
}

export function formatStudentsKpiHint(stats: BrandAnalyticsStats): string {
  const regions = new Set(stats.topCenters.map((center) => center.slug).filter(Boolean));
  const regionCount = Math.max(regions.size, stats.centersActive);
  if (regionCount <= 0) return "Across your network";
  return `Active in ${regionCount} region${regionCount === 1 ? "" : "s"}`;
}

export function formatCentersKpiHint(stats: BrandAnalyticsStats): string {
  const pending = centersOnboardingCount(stats);
  if (pending <= 0) return "All centers operational";
  return `${pending} in onboarding phase`;
}

export function formatRoyaltyKpiHint(stats: BrandAnalyticsStats): string {
  if (stats.unpaidInvoices > 0) {
    return `${stats.unpaidInvoices} settlement${stats.unpaidInvoices === 1 ? "" : "s"} pending`;
  }
  return "Paid settlements in period";
}

export function formatRoyaltyKpiValue(cents: number): string {
  const rupees = cents / 100;
  if (rupees >= 1_00_000) {
    const lakh = rupees / 1_00_000;
    return `₹${lakh >= 10 ? Math.round(lakh) : lakh.toFixed(1).replace(/\.0$/, "")}L`;
  }
  return formatInrFromPaise(cents);
}

export function sliceTrendRows(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod): BrandDailyTrendRow[] {
  return rows.slice(0, days);
}

export function sliceTrendWindow(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
): BrandDailyTrendRow[] {
  if (!range) return sliceTrendRows(rows, days);
  return rows.filter((row) => row.metric_date >= range.from && row.metric_date <= range.to);
}

export function presetWindowRange(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod
): AnalyticsDateRange | null {
  const windowRows = sliceTrendRows(rows, days);
  if (windowRows.length === 0) return null;
  const dates = windowRows.map((row) => row.metric_date).sort();
  return { from: dates[0]!, to: dates.at(-1)! };
}

export function buildEnrollmentChartBars(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
) {
  const chronological = [...sliceTrendWindow(rows, days, range)].reverse();
  const max = Math.max(...chronological.map((row) => row.enrollments_count), 1);
  return chronological.map((row, index) => ({
    key: row.metric_date,
    heightPercent: (row.enrollments_count / max) * 100,
    isHighlight: index === chronological.length - 1 && row.enrollments_count > 0,
    title: `${row.metric_date}: ${row.enrollments_count} enrollments`,
  }));
}

export function buildChartAxisLabels(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
) {
  const chronological = [...sliceTrendWindow(rows, days, range)].reverse();
  if (chronological.length === 0) {
    return { start: "", middle: "", end: "" };
  }

  const format = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const middle = chronological[Math.floor(chronological.length / 2)]!;
  const last = chronological.at(-1)!.metric_date;
  const bounds = availableTrendBounds(rows);
  return {
    start: format(chronological[0]!.metric_date),
    middle: format(middle.metric_date),
    end: !range && bounds?.max === last ? "Today" : format(last),
  };
}

export function formatPerformanceDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function performanceRowHasActivity(row: BrandDailyTrendRow): boolean {
  return row.enrollments_count > 0 || row.revenue_cents > 0;
}

export function peakEnrollmentCount(rows: BrandDailyTrendRow[]): number {
  return Math.max(0, ...rows.map((row) => row.enrollments_count));
}

export function performanceRowStatus(row: BrandDailyTrendRow, peakCount = 0): PerformanceRowStatus {
  if (row.enrollments_count > 0 && peakCount > 0 && row.enrollments_count === peakCount) return "peak";
  if (row.enrollments_count > 0) return "enrolling";
  if (row.revenue_cents > 0) return "royalty";
  return "quiet";
}

export function performanceStatusLabel(status: PerformanceRowStatus): string {
  if (status === "peak") return "Peak day";
  if (status === "enrolling") return "Enrolling";
  if (status === "royalty") return "Royalty in";
  return "Quiet";
}

export type PerformanceTableRow = {
  key: string;
  date: string;
  enrollments: number;
  royalty: string;
  royaltyCents: number;
  activeCenters: number;
  status: PerformanceRowStatus;
  highlight: boolean;
};

export function buildPerformanceTableRows(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  options: { activityOnly?: boolean; range?: AnalyticsDateRange | null } = {}
): PerformanceTableRow[] {
  const windowRows = [...sliceTrendWindow(rows, days, options.range)].reverse();
  const peak = peakEnrollmentCount(windowRows);
  const mapped = windowRows.map((row) => {
    const status = performanceRowStatus(row, peak);
    return {
      key: row.metric_date,
      date: formatPerformanceDate(row.metric_date),
      enrollments: row.enrollments_count,
      royalty: formatInrFromPaise(row.revenue_cents),
      royaltyCents: row.revenue_cents,
      activeCenters: row.active_centers,
      status,
      highlight: status === "peak",
    };
  });
  if (options.activityOnly === false) return mapped;
  return mapped.filter((row) => row.enrollments > 0 || row.royaltyCents > 0);
}

export type PerformanceSnapshot = {
  enrollments: number;
  enrollmentTrendPercent: number | null;
  royaltyCollectedCents: number;
  royaltyPendingCents: number;
  peakDate: string | null;
  peakEnrollments: number;
  centersEnrolling: number;
  activityDays: number;
  headline: string;
  windowDays: number;
};

export function buildPerformanceSnapshot(
  stats: BrandAnalyticsStats,
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
): PerformanceSnapshot {
  const windowRows = sliceTrendWindow(stats.recentDaily, days, range);
  const span = windowDayCount(days, range);
  const priorRows = range
    ? stats.recentDaily.filter((row) => {
        const priorEnd = addCalendarDays(range.from, -1);
        const priorStart = addCalendarDays(range.from, -span);
        return row.metric_date >= priorStart && row.metric_date <= priorEnd;
      })
    : stats.recentDaily.slice(days, days * 2);
  const enrollments = windowRows.reduce((sum, row) => sum + row.enrollments_count, 0);
  const priorEnrollments = priorRows.reduce((sum, row) => sum + row.enrollments_count, 0);
  const royaltyCollectedCents = windowRows.reduce((sum, row) => sum + row.revenue_cents, 0);
  const peak = windowRows.reduce<BrandDailyTrendRow | null>((best, row) => {
    if (row.enrollments_count <= 0) return best;
    if (!best || row.enrollments_count > best.enrollments_count) return row;
    return best;
  }, null);
  const activityDays = windowRows.filter(performanceRowHasActivity).length;
  const peakLabel = peak ? formatPerformanceDate(peak.metric_date) : null;
  const topName = stats.topCenters[0]?.name;
  const headlineParts = [
    `${enrollments.toLocaleString("en-IN")} new enrollment${enrollments === 1 ? "" : "s"}`,
    `${formatInrFromPaise(royaltyCollectedCents)} collected`,
  ];
  if (topName && enrollments > 0) headlineParts.push(`${topName} leading`);
  else if (stats.royaltyPendingCents > 0) headlineParts.push("settlements still due");
  const headline =
    enrollments === 0 && royaltyCollectedCents === 0
      ? "Quiet period — convert leads to see daily movement across your network."
      : headlineParts.join(" · ");

  return {
    enrollments,
    enrollmentTrendPercent: percentChange(enrollments, priorEnrollments),
    royaltyCollectedCents,
    royaltyPendingCents: stats.royaltyPendingCents,
    peakDate: peakLabel,
    peakEnrollments: peak?.enrollments_count ?? 0,
    centersEnrolling: peak?.active_centers ?? 0,
    activityDays,
    headline,
    windowDays: span,
  };
}

export function performanceCsvFilename(days: AnalyticsChartPeriod, range?: AnalyticsDateRange | null): string {
  if (range) return `performance-breakdown-${range.from}-to-${range.to}.csv`;
  return `performance-breakdown-${days}d.csv`;
}

export function performanceTableCsv(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
): string {
  const header = "Date,New Enrollments,Centers Enrolling,Royalty Collected,Pulse";
  const tableRows = buildPerformanceTableRows(rows, days, { range });
  const snapshotEnrollments = tableRows.reduce((sum, row) => sum + row.enrollments, 0);
  const snapshotRoyalty = tableRows.reduce((sum, row) => sum + row.royaltyCents, 0);
  const body = tableRows
    .map((row) =>
      [row.date, row.enrollments, row.activeCenters, `"${row.royalty}"`, performanceStatusLabel(row.status)].join(",")
    )
    .join("\n");
  const totals = [
    "Period total",
    snapshotEnrollments,
    "",
    `"${formatInrFromPaise(snapshotRoyalty)}"`,
    "",
  ].join(",");
  return `${header}\n${body}${body ? "\n" : ""}${totals}`;
}

export function downloadPerformanceCsv(
  rows: BrandDailyTrendRow[],
  days: AnalyticsChartPeriod,
  range?: AnalyticsDateRange | null
) {
  const csv = `\uFEFF${performanceTableCsv(rows, days, range)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = performanceCsvFilename(days, range);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function centerInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatCenterSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildAnalyticsActivityFeed(stats: BrandAnalyticsStats, nowMs = Date.now()): AnalyticsActivityItem[] {
  const items: AnalyticsActivityItem[] = [];

  const enrollmentDay = stats.recentDaily.find((row) => row.enrollments_count > 0);
  const topCenter = stats.topCenters[0];
  if (enrollmentDay && topCenter) {
    items.push({
      id: `enrollment-${enrollmentDay.metric_date}`,
      kind: "enrollment",
      title: "New Enrollment",
      subtitle: `Center: ${topCenter.name}`,
      value: `+${enrollmentDay.enrollments_count}`,
      valueTone: "primary",
      occurredAt: `${enrollmentDay.metric_date}T12:00:00.000Z`,
      href: "/app/centers",
    });
  }

  const royaltyDay = stats.recentDaily.find((row) => row.revenue_cents > 0);
  const royaltyCenter = stats.topCenters[1] ?? topCenter;
  if (royaltyDay && royaltyCenter) {
    items.push({
      id: `royalty-${royaltyDay.metric_date}`,
      kind: "royalty",
      title: "Royalty Recorded",
      subtitle: `Center: ${royaltyCenter.name}`,
      value: formatInrFromPaise(royaltyDay.revenue_cents),
      valueTone: "success",
      occurredAt: `${royaltyDay.metric_date}T16:00:00.000Z`,
      href: "/app/billing",
    });
  }

  const auditCenter = stats.topCenters[2] ?? stats.topCenters[0];
  if (auditCenter) {
    const auditDay = stats.recentDaily[2] ?? stats.recentDaily[0];
    items.push({
      id: `audit-${auditCenter.id}`,
      kind: "audit",
      title: "Center Audit Completed",
      subtitle: auditCenter.name,
      occurredAt: auditDay ? `${auditDay.metric_date}T09:00:00.000Z` : new Date(nowMs).toISOString(),
      href: "/app/centers",
    });
  }

  return items.slice(0, 3);
}

export function formatActivityTime(iso: string, nowMs = Date.now()): string {
  return formatCompactRelative(iso, nowMs);
}
