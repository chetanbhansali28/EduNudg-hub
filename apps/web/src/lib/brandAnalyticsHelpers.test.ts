import { describe, expect, it } from "vitest";
import {
  buildAnalyticsActivityFeed,
  buildEnrollmentChartBars,
  buildPerformanceTableRows,
  performanceRowStatus,
  performanceTableCsv,
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
  recentDaily: [
    { metric_date: "2026-06-22", enrollments_count: 2, revenue_cents: 45000, active_centers: 3 },
    { metric_date: "2026-06-21", enrollments_count: 0, revenue_cents: 0, active_centers: 3 },
    { metric_date: "2026-06-20", enrollments_count: 1, revenue_cents: 0, active_centers: 3 },
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

  it("performanceRowStatus marks pending when enrollments exist without royalty", () => {
    expect(performanceRowStatus({ metric_date: "2026-06-20", enrollments_count: 1, revenue_cents: 0, active_centers: 3 })).toBe(
      "pending"
    );
    expect(performanceRowStatus({ metric_date: "2026-06-22", enrollments_count: 2, revenue_cents: 45000, active_centers: 3 })).toBe(
      "processed"
    );
  });

  it("buildPerformanceTableRows returns chronological rows", () => {
    const rows = buildPerformanceTableRows(baseStats.recentDaily, 14);
    expect(rows[0]?.key).toBe("2026-06-20");
    expect(rows.at(-1)?.key).toBe("2026-06-22");
  });

  it("performanceTableCsv includes header and status column", () => {
    const csv = performanceTableCsv(baseStats.recentDaily, 14);
    expect(csv.split("\n")[0]).toContain("Status");
    expect(csv).toContain("pending");
  });

  it("buildAnalyticsActivityFeed creates enrollment and royalty items from stats", () => {
    const items = buildAnalyticsActivityFeed(baseStats);
    expect(items.some((item) => item.kind === "enrollment")).toBe(true);
    expect(items.some((item) => item.kind === "royalty")).toBe(true);
  });
});
