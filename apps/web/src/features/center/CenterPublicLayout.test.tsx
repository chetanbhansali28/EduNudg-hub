import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CenterPublicLayout } from "./CenterPublicLayout";

const { tenantState } = vi.hoisted(() => ({
  tenantState: {
    portalType: "center" as const,
    hostname: "koramangala.abacusworld.localhost",
    brandSlug: null as string | null,
    brandId: null,
    centerId: null,
    centerSlug: null as string | null,
  },
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/lib/centerLandingApi", () => ({
  fetchCenterLandingBundle: vi.fn(),
}));

describe("CenterPublicLayout", () => {
  it("regression_public_layout_does_not_fetch_dummy_center_slug", async () => {
    tenantState.brandSlug = null;
    tenantState.centerSlug = null;
    const { fetchCenterLandingBundle } = await import("@/lib/centerLandingApi");
    vi.mocked(fetchCenterLandingBundle).mockClear();

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<CenterPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Loading…")).toBeDefined();
    expect(fetchCenterLandingBundle).not.toHaveBeenCalled();
  });
});
