import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mergeAbacusClassicLandingConfig, buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { BrandPublicLayout } from "./BrandPublicLayout";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    hostname: "smart-brain-abacus.localhost",
    brandSlug: "smart-brain-abacus",
    brandId: null,
    centerId: null,
    centerSlug: null,
  }),
}));

vi.mock("@/lib/brandLandingApi", () => ({
  fetchBrandLandingBundle: vi.fn(),
}));

vi.mock("@/features/marketing/MarketingNav", () => ({
  MarketingNav: () => <nav data-testid="novu-nav">Novu nav</nav>,
}));

vi.mock("@/features/marketing/FooterSection", () => ({
  FooterSection: () => <footer data-testid="novu-footer">Novu footer</footer>,
}));

describe("BrandPublicLayout", () => {
  it("sprint1_renders_novu_layout_for_novu_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: buildBrandLandingConfig("Abacus World"),
      publicCurriculum: [],
      marketingTheme: "novu",
      publicStats: { centersCount: 0, studentsCount: 0 },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(screen.getByTestId("novu-nav")).toBeDefined();
    expect(screen.getByTestId("novu-footer")).toBeDefined();
    expect(document.querySelector(".marketing-page--abacus-classic")).toBeNull();
  });

  it("sprint1_renders_abacus_classic_layout_for_abacus_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      publicCurriculum: [],
      marketingTheme: "abacus-classic",
      publicStats: { centersCount: 5, studentsCount: 100 },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(document.querySelector(".marketing-page--abacus-classic")).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.queryByTestId("novu-nav")).toBeNull();
    expect(screen.queryByTestId("novu-footer")).toBeNull();
    expect(screen.getByText("Franchises")).toBeDefined();
    expect(screen.getByText("5+")).toBeDefined();
  });
});
