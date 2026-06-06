import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMarketingEditorPage } from "./BrandMarketingEditorPage";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

vi.mock("@/lib/brandLandingEditorApi", () => ({
  fetchBrandMarketingEditor: () =>
    Promise.resolve({
      settingsId: "settings-1",
      brandSlug: "abacus",
      existingSettings: {},
      landingConfig: DEFAULT_HOMEPAGE_CONFIG,
      centerLandingConfig: DEFAULT_HOMEPAGE_CONFIG,
    }),
  saveBrandMarketingLanding: vi.fn(),
}));

vi.mock("@/features/marketing/HomepageEditorForm", () => ({
  HomepageEditorForm: () => <div>Editor form</div>,
}));

describe("BrandMarketingEditorPage", () => {
  it("regression_stacked_sections_no_tabs_or_preview", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandMarketingEditorPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("Brand site (franchise recruitment)")).toBeDefined();
    expect(screen.getByText("Center sites (parent enrollment template)")).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Save" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /preview/i })).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
