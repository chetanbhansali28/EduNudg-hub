import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCenterSiteEditorPage, BrandMarketingEditorPage } from "./BrandMarketingEditorPage";
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
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandMarketingEditorPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("Homepage Configuration")).toBeDefined();
    expect(await screen.findByRole("heading", { name: "Brand site (franchise recruitment)" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Center sites \(parent enrollment template\)/i })).toBeNull();
    expect(screen.queryByText("Center Site Configuration")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(1);
    expect(screen.getByText("Novu editor form")).toBeDefined();
    expect(screen.queryByRole("link", { name: /preview/i })).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("sprint1_renders_abacus_classic_editor_when_theme_is_abacus_classic", async () => {
    fetchBrandMarketingEditor.mockResolvedValue({
      settingsId: "settings-1",
      brandSlug: "smart-brain-abacus",
      existingSettings: {},
      landingConfig: mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      centerLandingConfig: DEFAULT_HOMEPAGE_CONFIG,
      marketingTheme: "abacus-classic",
      legalPages: {},
      socialConnect: {},
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
    expect(screen.queryByText("Novu editor form")).toBeNull();
  });
});

describe("BrandCenterSiteEditorPage", () => {
  it("regression_center_site_config_is_its_own_page", async () => {
    fetchBrandMarketingEditor.mockResolvedValue({
      settingsId: "settings-1",
      brandSlug: "abacus",
      existingSettings: {},
      landingConfig: DEFAULT_HOMEPAGE_CONFIG,
      centerLandingConfig: DEFAULT_HOMEPAGE_CONFIG,
      marketingTheme: "novu",
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandCenterSiteEditorPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Center Site Configuration")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Center sites (parent enrollment template)" })).toBeDefined();
    expect(screen.getByText("Novu editor form")).toBeDefined();
    expect(screen.queryByText("Homepage Configuration")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Brand site (franchise recruitment)" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(1);
  });

  it("regression_center_site_uses_abacus_editor_when_theme_is_abacus_classic", async () => {
    fetchBrandMarketingEditor.mockResolvedValue({
      settingsId: "settings-1",
      brandSlug: "smart-brain-abacus",
      existingSettings: {},
      landingConfig: mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      centerLandingConfig: mergeAbacusClassicLandingConfig("Sample Center"),
      marketingTheme: "abacus-classic",
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandCenterSiteEditorPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Center Site Configuration")).toBeDefined();
    expect(screen.getByText("Abacus Classic editor form")).toBeDefined();
    expect(screen.queryByText("Novu editor form")).toBeNull();
  });
});
