import { describe, expect, it } from "vitest";
import {
  buildAnalyticsActivityFeed,
  buildEnrollmentChartBars,
  buildPerformanceSnapshot,
  buildPerformanceTableRows,
  performanceRowStatus,
  performanceTableCsv,
  performanceCsvFilename,
} from "@/lib/brandAnalyticsHelpers";
import type { BrandAnalyticsStats } from "@/lib/brandAnalyticsStats";

const baseStats: BrandAnalyticsStats = {
  centersTotal: 4,
  centersActive: 3,
  students: 120,
  enrollmentsActive: 95,
  leadsOpen: 2,
  revenue30dCents: 45000,
  enrollments30d: 10,
  unpaidInvoices: 1,
  unpaidAmountCents: 5000,
  royaltyPendingCents: 12000,
  recentDaily: [
    { metric_date: "2026-06-22", enrollments_count: 2, revenue_cents: 45000, active_centers: 2 },
    { metric_date: "2026-06-21", enrollments_count: 0, revenue_cents: 0, active_centers: 0 },
    { metric_date: "2026-06-20", enrollments_count: 1, revenue_cents: 0, active_centers: 1 },
  ],
  topCenters: [
    { id: "c1", name: "Koramangala", slug: "koramangala", enrollments30d: 5, fees30dCents: 0 },
    { id: "c2", name: "Indiranagar", slug: "indiranagar", enrollments30d: 3, fees30dCents: 0 },
  ],
};

describe("brandAnalyticsHelpers", () => {
  it("buildEnrollmentChartBars highlights the latest non-zero bar", () => {
    const bars = buildEnrollmentChartBars(baseStats.recentDaily, 14);
    expect(bars.at(-1)?.isHighlight).toBe(true);
    expect(bars.at(-1)?.heightPercent).toBeGreaterThan(0);
  });

  it("performanceRowStatus marks peak, enrolling, and royalty pulses", () => {
    expect(
      performanceRowStatus({ metric_date: "2026-06-22", enrollments_count: 2, revenue_cents: 45000, active_centers: 2 }, 2)
    ).toBe("peak");
    expect(
      performanceRowStatus({ metric_date: "2026-06-20", enrollments_count: 1, revenue_cents: 0, active_centers: 1 }, 2)
    ).toBe("enrolling");
    expect(
      performanceRowStatus({ metric_date: "2026-06-19", enrollments_count: 0, revenue_cents: 9000, active_centers: 0 }, 2)
    ).toBe("royalty");
    expect(
      performanceRowStatus({ metric_date: "2026-06-21", enrollments_count: 0, revenue_cents: 0, active_centers: 0 }, 2)
    ).toBe("quiet");
  });

  it("regression_performanceBreakdownOmitsQuietDays", () => {
    const rows = buildPerformanceTableRows(baseStats.recentDaily, 14);
    expect(rows.map((row) => row.key)).toEqual(["2026-06-20", "2026-06-22"]);
    expect(rows.some((row) => row.status === "quiet")).toBe(false);
    expect(rows.at(-1)?.highlight).toBe(true);
  });

  it("performanceTableCsv includes pulse and period total", () => {
    const csv = performanceTableCsv(baseStats.recentDaily, 14);
    expect(csv.split("\n")[0]).toContain("Pulse");
    expect(csv).toContain("Peak day");
    expect(csv).toContain("Period total");
    expect(csv).not.toContain("quiet");
  });

  it("buildPerformanceSnapshot writes a headline a brand owner can scan", () => {
    const snapshot = buildPerformanceSnapshot(baseStats, 14);
    expect(snapshot.enrollments).toBe(3);
    expect(snapshot.royaltyCollectedCents).toBe(45000);
    expect(snapshot.headline).toContain("Koramangala leading");
    expect(snapshot.headline).toContain("3 new enrollment");
    expect(snapshot.activityDays).toBe(2);
    expect(snapshot.windowDays).toBe(14);
  });

  it("regression_performanceRangeFiltersTableAndCsvImmediately", () => {
    const range = { from: "2026-06-22", to: "2026-06-22" };
    const rows = buildPerformanceTableRows(baseStats.recentDaily, 14, { range });
    expect(rows.map((row) => row.key)).toEqual(["2026-06-22"]);
    expect(rows[0]?.enrollments).toBe(2);
    const csv = performanceTableCsv(baseStats.recentDaily, 14, range);
    expect(csv).toContain("Peak day");
    expect(csv).not.toContain("20 Jun");
  });

  it("regression_csvFilenameKeepsPresetAndCustomRange", () => {
    expect(performanceCsvFilename(14)).toBe("performance-breakdown-14d.csv");
    expect(performanceCsvFilename(30, { from: "2026-06-01", to: "2026-06-10" })).toBe(
      "performance-breakdown-2026-06-01-to-2026-06-10.csv"
    );
  });

  it("buildAnalyticsActivityFeed creates enrollment and royalty items from stats", () => {
    const items = buildAnalyticsActivityFeed(baseStats);
    expect(items.some((item) => item.kind === "enrollment")).toBe(true);
    expect(items.some((item) => item.kind === "royalty")).toBe(true);
  });
});
