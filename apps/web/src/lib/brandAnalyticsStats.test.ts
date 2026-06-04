import { describe, expect, it } from "vitest";
import {
  buildDailyTrend,
  groupEnrollmentsByDate,
  recentDayKeys,
} from "@/lib/brandAnalyticsStats";

describe("brandAnalyticsStats", () => {
  it("groups enrollments by UTC date", () => {
    const counts = groupEnrollmentsByDate(
      [
        { enrolled_at: "2026-06-01T10:00:00Z" },
        { enrolled_at: "2026-06-01T15:00:00Z" },
        { enrolled_at: "2026-05-30T08:00:00Z" },
      ],
      "2026-05-31"
    );
    expect(counts.get("2026-06-01")).toBe(2);
    expect(counts.has("2026-05-30")).toBe(false);
  });

  it("buildDailyTrend fills missing days with zero enrollments", () => {
    const enrollmentCounts = new Map([["2026-06-03", 2]]);
    const revenueByDate = new Map([["2026-06-03", 50000]]);
    const trend = buildDailyTrend(enrollmentCounts, revenueByDate, 4, 3);
    expect(trend).toHaveLength(3);
    expect(trend[0].metric_date).toBe(recentDayKeys(1)[0]);
    const busy = trend.find((row) => row.enrollments_count === 2);
    expect(busy?.revenue_cents).toBe(50000);
    expect(trend.every((row) => row.active_centers === 4)).toBe(true);
  });
});
