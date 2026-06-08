import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell, KpiCard, KpiGrid, ThemeProvider } from "@edunudg/ui";
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

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => Promise.resolve({ data: [], count: 0, error: null }),
    }),
  }),
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
        <KpiGrid>
          <KpiCard label="Active brands" value={3} />
        </KpiGrid>
      </AppShell>
    );

    expect(document.querySelector(".ed-shell--backend")).toBeTruthy();
    expect(document.querySelector(".ed-shell--backend .ed-kpi-grid")).toBeTruthy();
  });

  it("critical_platform_admin_dashboard_uses_backend_kpi_theme", async () => {
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
    expect(document.querySelector(".ed-shell--backend .ed-kpi-grid")).toBeTruthy();
  });
});
