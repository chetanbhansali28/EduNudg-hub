import { describe, expect, it } from "vitest";
import {
  brandDashboardGreeting,
  buildBrandActivityFeed,
  buildExpansionGoals,
  buildRevenueBarHeights,
  computeCenterHealthPercent,
  computeRevenueTrendPercent,
  formatCompactRelative,
  formatInrCompact,
  percentChange,
} from "./brandDashboardHelpers";

describe("brandDashboardHelpers", () => {
  it("formats compact currency and relative timestamps", () => {
    expect(formatInrCompact(1_200_000_000)).toBe("₹1.2Cr");
    const twoMinutesAgo = new Date("2026-06-15T10:00:00Z").toISOString();
    const now = new Date("2026-06-15T10:02:00Z").getTime();
    expect(formatCompactRelative(twoMinutesAgo, now)).toBe("2m ago");
  });

  it("computes revenue trend and bar heights", () => {
    const rows = Array.from({ length: 14 }, (_, index) => ({
      metric_date: `2026-06-${String(index + 1).padStart(2, "0")}`,
      enrollments_count: 0,
      revenue_cents: index < 7 ? 1000 : 500,
      active_centers: 3,
    }));
    expect(computeRevenueTrendPercent(rows)).toBe(100);
    expect(buildRevenueBarHeights(rows)).toHaveLength(7);
  });

  it("builds activity feed from inquiries, leads, and stale counts", () => {
    const feed = buildBrandActivityFeed({
      inquiries: [
        {
          id: "i1",
          full_name: "Alex Owner",
          proposed_franchise_name: "Bright Minds Academy",
          city: "San Francisco",
          state: "CA",
          status: "new",
          created_at: "2026-06-15T09:00:00Z",
        },
      ],
      leads: [
        {
          id: "l1",
          full_name: "James Wilson",
          child_name: null,
          city: "Mumbai",
          status: "qualified",
          created_at: "2026-06-14T09:00:00Z",
          updated_at: "2026-06-15T08:00:00Z",
        },
      ],
      centers: [
        {
          id: "c1",
          name: "EduCenter North Branch",
          status: "active",
          updated_at: "2026-06-15T07:00:00Z",
        },
      ],
      staleLeads: 3,
      nowMs: new Date("2026-06-15T10:00:00Z").getTime(),
    });

    expect(feed).toHaveLength(4);
    expect(feed.some((item) => item.title.includes("Bright Minds Academy"))).toBe(true);
    expect(feed.some((item) => item.kind === "audit")).toBe(true);
  });

  it("builds expansion goals from active regions", () => {
    expect(
      buildExpansionGoals(
        [
          { region: "Delhi NCR", city: "Delhi", status: "active" },
          { region: "Delhi NCR", city: "Noida", status: "active" },
          { region: "Mumbai Metro", city: "Mumbai", status: "active" },
        ],
        10
      )
    ).toEqual([
      { id: "Delhi NCR", label: "Delhi NCR", percent: 20 },
      { id: "Mumbai Metro", label: "Mumbai Metro", percent: 10 },
    ]);
  });

  it("regression_brand_dashboard_greeting_uses_director_fallback", () => {
    expect(brandDashboardGreeting("", 9)).toBe("Good morning, Director");
    expect(percentChange(12, 10)).toBe(20);
    expect(computeCenterHealthPercent(9, 10)).toBe(90);
  });
});
