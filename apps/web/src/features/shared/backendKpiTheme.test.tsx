import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell, ThemeProvider } from "@edunudg/ui";
import { PlatformLayout } from "@/features/platform/PlatformLayout";
import { CommandCenter } from "@/features/platform/CommandCenter";

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: { id: "u1", email: "admin@edunudg.com", user_metadata: { full_name: "Admin" } },
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
  useStaffProfile: () => ({ name: "Admin", email: "admin@edunudg.com" }),
}));

vi.mock("@/hooks/usePlatformShellBranding", () => ({
  usePlatformShellBranding: () => ({ productName: "EduNudg", logoUrl: null }),
}));

vi.mock("@/hooks/useShellContextCounts", () => ({
  useShellContextCounts: () => ({ data: { pendingBrandSignups: 0 } }),
  shellActionHints: () => [],
}));

vi.mock("@/lib/platformDashboardApi", () => ({
  fetchPlatformDashboardHome: vi.fn(async () => ({
    activeBrands: 0,
    totalBrands: 0,
    activeBrandsTrend: null,
    totalCenters: 0,
    centersTrend: null,
    regionCount: 0,
    planCount: 0,
    planNames: "",
    plansTrend: null,
    monthlyEnrollments: [],
    quarterlyEnrollments: [],
    peakEnrollment: 0,
    enterpriseLeadsConverted: 0,
    enterpriseAvatars: [],
    extraEnterpriseCount: 0,
    onboardingRows: [],
    activities: [],
  })),
}));

function renderWithRouter(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("backend KPI theme", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("critical_backend_shell_applies_compact_kpi_grid", () => {
    renderWithRouter(
      <AppShell portalLabel="Platform Owner" navSections={[]} surface="backend">
        <p>Child</p>
      </AppShell>
    );

    expect(document.querySelector(".ed-shell--backend")).toBeTruthy();
  });

  it("critical_platform_admin_dashboard_uses_dashboard_workspace", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/admin"]}>
          <ThemeProvider>
            <Routes>
              <Route path="/admin" element={<PlatformLayout />}>
                <Route index element={<CommandCenter />} />
              </Route>
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Executive Command Center")).toBeDefined();
    expect(document.querySelector(".ed-dash")).toBeTruthy();
  });
});
