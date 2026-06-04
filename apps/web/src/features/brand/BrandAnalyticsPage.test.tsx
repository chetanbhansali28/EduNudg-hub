import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandAnalyticsPage } from "./BrandAnalyticsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

vi.mock("@/hooks/useBrandMonitoringStats", () => ({
  useBrandMonitoringStats: () => ({
    isLoading: false,
    data: {
      centersTotal: 3,
      centersActive: 2,
      students: 40,
      enrollmentsActive: 35,
      leadsOpen: 5,
      revenue30dCents: 120000,
      enrollments30d: 8,
      unpaidInvoices: 1,
      unpaidAmountCents: 50000,
      recentDaily: [{ metric_date: "2026-06-01", enrollments_count: 2, revenue_cents: 0, active_centers: 2 }],
      topCenters: [{ id: "c1", name: "Koramangala", slug: "koramangala", enrollments30d: 5, fees30dCents: 0 }],
    },
  }),
  formatInrFromPaise: (c: number) => `₹${c / 100}`,
}));

describe("BrandAnalyticsPage", () => {
  it("regression_read_only_auto_generated_metrics", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandAnalyticsPage />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Nothing to enter manually/)).toBeDefined();
    expect(screen.getByText("New enrollments (30d)")).toBeDefined();
    expect(screen.queryByText("Add snapshot")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
