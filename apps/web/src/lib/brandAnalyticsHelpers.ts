import type { BrandAnalyticsStats, BrandDailyTrendRow } from "@/lib/brandAnalyticsStats";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { formatCompactRelative, percentChange } from "@/lib/brandDashboardHelpers";

export type AnalyticsChartPeriod = 14 | 30;

export type PerformanceRowStatus = "processed" | "pending";

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

export function buildEnrollmentChartBars(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod) {
  const chronological = [...sliceTrendRows(rows, days)].reverse();
  const max = Math.max(...chronological.map((row) => row.enrollments_count), 1);
  return chronological.map((row, index) => ({
    key: row.metric_date,
    heightPercent: (row.enrollments_count / max) * 100,
    isHighlight: index === chronological.length - 1 && row.enrollments_count > 0,
    title: `${row.metric_date}: ${row.enrollments_count} enrollments`,
  }));
}

export function buildChartAxisLabels(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod) {
  const chronological = [...sliceTrendRows(rows, days)].reverse();
  if (chronological.length === 0) {
    return { start: "", middle: "", end: "" };
  }

  const format = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const middle = chronological[Math.floor(chronological.length / 2)]!;
  return {
    start: format(chronological[0]!.metric_date),
    middle: format(middle.metric_date),
    end: "Today",
  };
}

export function performanceRowStatus(row: BrandDailyTrendRow): PerformanceRowStatus {
  if (row.enrollments_count > 0 && row.revenue_cents <= 0) return "pending";
  return "processed";
}

export function formatPerformanceDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function buildPerformanceTableRows(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod) {
  return [...sliceTrendRows(rows, days)].reverse().map((row) => ({
    key: row.metric_date,
    date: formatPerformanceDate(row.metric_date),
    enrollments: row.enrollments_count,
    royalty: formatInrFromPaise(row.revenue_cents),
    activeCenters: row.active_centers,
    status: performanceRowStatus(row),
  }));
}

export function performanceTableCsv(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod): string {
  const header = "Date,New Enrollments,Royalty (Paid),Active Centers,Status";
  const body = buildPerformanceTableRows(rows, days)
    .map((row) =>
      [row.date, row.enrollments, `"${row.royalty}"`, row.activeCenters, row.status].join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadPerformanceCsv(rows: BrandDailyTrendRow[], days: AnalyticsChartPeriod) {
  const csv = performanceTableCsv(rows, days);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `performance-breakdown-${days}d.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
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
