import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BrandLandingPage } from "./BrandLandingPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    hostname: "abacusworld.localhost",
    brandSlug: "abacusworld",
    brandId: null,
    centerId: null,
    centerSlug: null,
  }),
}));

vi.mock("@/lib/brandLandingApi", async () => {
  const { buildBrandLandingConfig } = await import("@/lib/brandLandingDefaults");
  return {
    fetchBrandLandingConfig: vi.fn().mockResolvedValue(buildBrandLandingConfig("Abacus World")),
  };
});

vi.mock("@/features/marketing/MarketingContent", () => ({
  MarketingContent: ({ brandSlug }: { brandSlug?: string }) => (
    <div>
      Franchise landing
      {brandSlug && <span>{brandSlug}</span>}
    </div>
  ),
}));

describe("BrandLandingPage", () => {
  it("regression_loads_brand_slug_into_marketing_content", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BrandLandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Franchise landing")).toBeDefined();
    expect(screen.getByText("abacusworld")).toBeDefined();
  });
});
