import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
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

const fetchBrandLandingBundle = vi.fn();

vi.mock("@/lib/brandLandingApi", () => ({
  fetchBrandLandingBundle: (...args: unknown[]) => fetchBrandLandingBundle(...args),
}));

vi.mock("@/features/marketing/MarketingContent", () => ({
  MarketingContent: ({ config, brandSlug }: { config?: { hero?: { line1: string } }; brandSlug?: string }) => {
    if (!config?.hero) {
      throw new Error("config.hero is undefined");
    }
    return (
      <div>
        Franchise landing
        <span>{config.hero.line1}</span>
        {brandSlug && <span>{brandSlug}</span>}
      </div>
    );
  },
}));

describe("BrandLandingPage", () => {
  it("regression_loads_brand_slug_into_marketing_content", async () => {
    fetchBrandLandingBundle.mockResolvedValue({
      config: buildBrandLandingConfig("Abacus World"),
      publicCurriculum: [],
    });

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

  it("regression_legacy_cached_homepage_config_does_not_crash_marketing_content", async () => {
    const legacyConfig = buildBrandLandingConfig("Abacus World");
    fetchBrandLandingBundle.mockResolvedValue(legacyConfig);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BrandLandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Franchise landing")).toBeDefined();
    expect(screen.getByText("Own an")).toBeDefined();
  });
});
