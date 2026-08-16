import { describe, expect, it } from "vitest";
import {
  buildDailyTrend,
  calendarDayKey,
  groupEnrollmentsByDate,
  paidRoyaltyDay,
  recentDayKeys,
  sumMapInWindow,
} from "@/lib/brandAnalyticsStats";

describe("brandAnalyticsStats", () => {
  it("groups enrollments by IST calendar date", () => {
    const counts = groupEnrollmentsByDate(
      [
        { enrolled_at: "2026-06-01T10:00:00Z" },
        { enrolled_at: "2026-06-01T15:00:00Z" },
        { enrolled_at: "2026-05-30T08:00:00Z" },
        { enrolled_at: "2026-08-16T19:30:00Z" },
      ],
      "2026-05-31"
    );
    expect(counts.get("2026-06-01")).toBe(2);
    expect(counts.has("2026-05-30")).toBe(false);
    expect(counts.get("2026-08-17")).toBe(1);
  });

  it("calendarDayKey uses Asia/Kolkata", () => {
    expect(calendarDayKey("2026-08-16T18:29:00Z")).toBe("2026-08-16");
    expect(calendarDayKey("2026-08-16T18:31:00Z")).toBe("2026-08-17");
  });

  it("paidRoyaltyDay prefers the paid timestamp over period end", () => {
    expect(paidRoyaltyDay({ updated_at: "2026-08-10T08:00:00Z", period_end: "2026-07-31" })).toBe("2026-08-10");
    expect(paidRoyaltyDay({ period_end: "2026-07-31" })).toBe("2026-07-31");
  });

  it("buildDailyTrend fills missing days with zero enrollments and per-day centers", () => {
    const now = new Date("2026-08-16T12:00:00+05:30");
    const dayKeys = recentDayKeys(3, now);
    const busyDay = dayKeys[1]!;
    const enrollmentCounts = new Map([[busyDay, 2]]);
    const revenueByDate = new Map([[busyDay, 50000]]);
    const centersByDate = new Map([[busyDay, 1]]);
    const trend = buildDailyTrend(enrollmentCounts, revenueByDate, centersByDate, 3, now);
    expect(trend).toHaveLength(3);
    expect(trend[0].metric_date).toBe(dayKeys[0]);
    const busy = trend.find((row) => row.enrollments_count === 2);
    expect(busy?.revenue_cents).toBe(50000);
    expect(busy?.active_centers).toBe(1);
    expect(trend.filter((row) => row.metric_date !== busyDay).every((row) => row.active_centers === 0)).toBe(true);
  });

  it("sumMapInWindow ignores dates outside the KPI window", () => {
    const values = new Map([
      ["2026-08-01", 2],
      ["2026-07-01", 9],
    ]);
    expect(sumMapInWindow(values, "2026-08-01", "2026-08-16")).toBe(2);
  });
});
