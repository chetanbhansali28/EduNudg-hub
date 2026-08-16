import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandAnalyticsPage } from "./BrandAnalyticsPage";
import { BrandAnalyticsView } from "./analytics/BrandAnalyticsView";
import type { BrandAnalyticsStats } from "@/lib/brandAnalyticsStats";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/hooks/useBrandMonitoringStats", () => ({
  useBrandMonitoringStats: () => ({
    isLoading: false,
    data: mockStats,
  }),
  formatInrFromPaise: (c: number) => `₹${(c / 100).toFixed(2)}`,
}));

const mockStats: BrandAnalyticsStats = {
  centersTotal: 3,
  centersActive: 2,
  students: 40,
  enrollmentsActive: 35,
  leadsOpen: 5,
  revenue30dCents: 120000,
  enrollments30d: 8,
  unpaidInvoices: 1,
  unpaidAmountCents: 50000,
  royaltyPendingCents: 0,
  recentDaily: [
    { metric_date: "2026-06-01", enrollments_count: 2, revenue_cents: 120000, active_centers: 2 },
    { metric_date: "2026-05-31", enrollments_count: 0, revenue_cents: 0, active_centers: 2 },
  ],
  topCenters: [{ id: "c1", name: "Koramangala", slug: "koramangala", enrollments30d: 5, fees30dCents: 0 }],
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <BrandAnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BrandAnalyticsPage", () => {
  it("regression_read_only_auto_generated_metrics", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeDefined();
    expect(screen.getByText(/Live metrics from your franchise network/)).toBeDefined();
    expect(screen.getByText("New Enrollments (30D)")).toBeDefined();
    expect(screen.getByText("Performance Breakdown")).toBeDefined();
    expect(screen.getAllByText("Peak day").length).toBeGreaterThan(0);
    expect(screen.queryByText("Processed")).toBeNull();
    expect(screen.queryByText("Add snapshot")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDefined();
    expect(screen.getByLabelText("From")).toBeDefined();
    expect(screen.getByLabelText("To")).toBeDefined();
  });

  it("regression_analyticsDateRangeUpdatesTableImmediately", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-06-01" } });
    expect(screen.getByText("Period total")).toBeDefined();
    expect(screen.getAllByRole("button", { name: "14D" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "30D" }).length).toBeGreaterThan(0);
  });
});

describe("BrandAnalyticsView", () => {
  it("renders mobile analytics sections", () => {
    render(
      <MemoryRouter>
        <BrandAnalyticsView stats={mockStats} isMobile />
      </MemoryRouter>
    );
    expect(screen.getByText("Open Leads")).toBeDefined();
    expect(screen.getByText("Recent Activity")).toBeDefined();
    expect(screen.getByText("Performance Breakdown")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Performance Breakdown" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDefined();
  });
});
