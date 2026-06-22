import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { PlatformLayout } from "@/features/platform/PlatformLayout";
import { CommandCenter } from "@/features/platform/CommandCenter";
import type { PlatformDashboardHome } from "@/lib/platformDashboardHelpers";

const mockDashboard: PlatformDashboardHome = {
  activeBrands: 4,
  totalBrands: 4,
  activeBrandsTrend: "+1",
  totalCenters: 12,
  centersTrend: "+4",
  regionCount: 2,
  planCount: 3,
  planNames: "Standard, Pro, Enterprise",
  plansTrend: null,
  monthlyEnrollments: [
    { key: "2026-01", label: "Jan", value: 10 },
    { key: "2026-02", label: "Feb", value: 20 },
    { key: "2026-03", label: "Mar", value: 30 },
    { key: "2026-04", label: "Apr", value: 40 },
    { key: "2026-05", label: "May", value: 50 },
    { key: "2026-06", label: "Jun", value: 60 },
    { key: "2026-07", label: "Jul", value: 70 },
  ],
  quarterlyEnrollments: [
    { key: "2025-Q4", label: "Q4 '25", value: 80 },
    { key: "2026-Q1", label: "Q1 '26", value: 90 },
    { key: "2026-Q2", label: "Q2 '26", value: 100 },
    { key: "2026-Q3", label: "Q3 '26", value: 110 },
  ],
  peakEnrollment: 70,
  enterpriseLeadsConverted: 2,
  enterpriseAvatars: [{ key: "b1", label: "AA" }],
  extraEnterpriseCount: 1,
  onboardingRows: [
    {
      id: "b1",
      name: "Alpha Academy",
      slug: "alpha",
      planName: "Enterprise",
      centerCount: 24,
      status: "completed",
      statusLabel: "Completed",
      meta: "Onboarded: 2h ago",
      logoUrl: null,
    },
  ],
  activities: [
    {
      id: "a1",
      kind: "brand",
      title: "New Franchise Created",
      description: "Alpha Academy launched on the platform.",
      occurredAt: new Date().toISOString(),
      href: "/admin/brands/alpha",
    },
  ],
};

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: { id: "u1", email: "admin@edunudg.com", user_metadata: { full_name: "Platform" } },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "platform",
    hostname: "localhost",
    brandId: null,
    centerId: null,
    brandSlug: null,
    centerSlug: null,
  }),
}));

vi.mock("@/hooks/useStaffProfile", () => ({
  useStaffProfile: () => ({ name: "Platform", email: "admin@edunudg.com" }),
}));

vi.mock("@/hooks/usePlatformShellBranding", () => ({
  usePlatformShellBranding: () => ({ productName: "EduNudg", logoUrl: null }),
}));

vi.mock("@/hooks/useShellContextCounts", () => ({
  useShellContextCounts: () => ({ data: { pendingBrandSignups: 0 } }),
  shellActionHints: () => [],
}));

vi.mock("@/lib/platformDashboardApi", () => ({
  fetchPlatformDashboardHome: vi.fn(async () => mockDashboard),
}));

function renderDashboard(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin"]}>
        <ThemeProvider>{ui}</ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CommandCenter", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("regression_platform_dashboard_renders_executive_command_center", async () => {
    renderDashboard(
      <Routes>
        <Route path="/admin" element={<PlatformLayout />}>
          <Route index element={<CommandCenter />} />
        </Route>
      </Routes>
    );

    expect(await screen.findByText("Executive Command Center")).toBeDefined();
    expect(screen.getByText("Active brands")).toBeDefined();
    expect(screen.getByText("Quick Actions")).toBeDefined();
    expect(screen.getByText("Network Growth")).toBeDefined();
    expect(screen.getByText("Recent Brand Onboarding")).toBeDefined();
    expect(screen.getByText("Alpha Academy")).toBeDefined();
    expect(document.querySelector(".ed-dash")).toBeTruthy();
  });
});
