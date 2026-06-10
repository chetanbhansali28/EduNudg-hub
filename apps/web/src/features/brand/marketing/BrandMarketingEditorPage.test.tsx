import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMarketingEditorPage } from "./BrandMarketingEditorPage";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

const fetchBrandMarketingEditor = vi.fn();

vi.mock("@/lib/brandLandingEditorApi", () => ({
  fetchBrandMarketingEditor: (...args: unknown[]) => fetchBrandMarketingEditor(...args),
  saveBrandMarketingLanding: vi.fn(),
  landingConfigToPartial: vi.fn(),
}));

vi.mock("@/features/marketing/HomepageEditorForm", () => ({
  HomepageEditorForm: () => <div>Novu editor form</div>,
}));

vi.mock("@/features/marketing/AbacusClassicEditorForm", () => ({
  AbacusClassicEditorForm: () => <div>Abacus Classic editor form</div>,
}));

describe("BrandMarketingEditorPage", () => {
  it("regression_stacked_sections_no_tabs_or_preview", async () => {
    fetchBrandMarketingEditor.mockResolvedValue({
      settingsId: "settings-1",
      brandSlug: "abacus",
      existingSettings: {},
      landingConfig: DEFAULT_HOMEPAGE_CONFIG,
      centerLandingConfig: DEFAULT_HOMEPAGE_CONFIG,
      marketingTheme: "novu",
    });

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
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /preview/i })).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getAllByText("Novu editor form")).toHaveLength(2);
  });

  it("sprint1_renders_abacus_classic_editor_when_theme_is_abacus_classic", async () => {
    fetchBrandMarketingEditor.mockResolvedValue({
      settingsId: "settings-1",
      brandSlug: "smart-brain-abacus",
      existingSettings: {},
      landingConfig: mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      centerLandingConfig: DEFAULT_HOMEPAGE_CONFIG,
      marketingTheme: "abacus-classic",
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandMarketingEditorPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Abacus Classic editor form")).toBeDefined();
    expect(screen.getAllByText("Novu editor form")).toHaveLength(1);
  });
});
