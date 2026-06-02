import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CenterLandingPage } from "./CenterLandingPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    hostname: "koramangala.abacusworld.localhost",
    brandSlug: "abacusworld",
    centerSlug: "koramangala",
    brandId: null,
    centerId: null,
  }),
}));

vi.mock("@/lib/centerLandingApi", async () => {
  const { buildCenterLandingConfig } = await import("@/lib/centerLandingDefaults");
  return {
    fetchCenterLandingConfig: vi
      .fn()
      .mockResolvedValue(
        buildCenterLandingConfig("Abacus World Koramangala", "Abacus World", "Bengaluru")
      ),
  };
});

vi.mock("@/features/marketing/MarketingContent", () => ({
  MarketingContent: ({
    brandSlug,
    centerSlug,
  }: {
    brandSlug?: string;
    centerSlug?: string;
  }) => (
    <div>
      Center landing
      {brandSlug && <span>{brandSlug}</span>}
      {centerSlug && <span>{centerSlug}</span>}
    </div>
  ),
}));

describe("CenterLandingPage", () => {
  it("regression_loads_center_slug_into_marketing_content", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CenterLandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Center landing")).toBeDefined();
    expect(screen.getByText("abacusworld")).toBeDefined();
    expect(screen.getByText("koramangala")).toBeDefined();
  });
});
