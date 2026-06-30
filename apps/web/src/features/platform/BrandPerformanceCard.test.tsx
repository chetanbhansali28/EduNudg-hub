import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { BrandAnalyticsStats } from "@/lib/brandAnalyticsStats";
import { BrandPerformanceCard } from "./BrandPerformanceCard";

const sampleStats: BrandAnalyticsStats = {
  revenue30dCents: 0,
  enrollments30d: 2,
  enrollmentsActive: 2,
  students: 2,
  centersActive: 2,
  centersTotal: 2,
  leadsOpen: 2,
  unpaidAmountCents: 2_500_000,
  unpaidInvoices: 1,
  recentDaily: Array.from({ length: 30 }, (_, i) => ({
    metric_date: `2026-06-${String(30 - i).padStart(2, "0")}`,
    enrollments_count: i === 0 ? 1 : 0,
    revenue_cents: 0,
    active_centers: 2,
  })),
  topCenters: [],
};

describe("BrandPerformanceCard", () => {
  it("regression_performance_card_collapsed_by_default", () => {
    render(
      <BrandPerformanceCard loading={false} stats={sampleStats} subscription={null} />
    );

    expect(screen.getByRole("heading", { name: "Performance (last 30 days)" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Expand performance section" }).getAttribute("aria-expanded")).toBe(
      "false"
    );
    expect(screen.queryByText("Royalty collected (30d)")).toBeNull();
    expect(screen.queryByText("Daily trend (computed from enrollments & royalties)")).toBeNull();
  });

  it("regression_performance_card_expands_on_toggle", () => {
    render(
      <BrandPerformanceCard loading={false} stats={sampleStats} subscription={null} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Expand performance section" }));

    expect(screen.getByRole("button", { name: "Collapse performance section" }).getAttribute("aria-expanded")).toBe(
      "true"
    );
    expect(screen.getByText("Royalty collected (30d)")).toBeDefined();
    expect(screen.getByText("Daily trend (computed from enrollments & royalties)")).toBeDefined();
  });
});
