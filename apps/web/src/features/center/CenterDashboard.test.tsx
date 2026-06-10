import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterDashboard } from "./CenterDashboard";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    centerId: "center-1",
  }),
}));

vi.mock("@/lib/centerDashboardStats", () => ({
  fetchCenterDashboardStats: () =>
    Promise.resolve({
      batchCount: 3,
      sessionsToday: 1,
      attendanceRate7d: 88,
      openLeads: 4,
      pendingConversion: 2,
      activeEnrollments: 25,
      feeCollectionRate: 75,
      overdueFeesCents: 500000,
      lowStockItems: 1,
      unpaidMerchandiseCount: 2,
      unpaidMerchandiseCents: 150000,
      overdueMerchandiseCount: 1,
    }),
}));

describe("CenterDashboard", () => {
  it("regression_live_center_kpis", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterDashboard />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Open leads")).toBeDefined();
    expect(screen.getByText("Ready to convert")).toBeDefined();
    expect(screen.getByText("75%")).toBeDefined();
  });
});
