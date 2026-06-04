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

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe("BrandMarketingEditorPage", () => {
  it("regression_stacked_sections_no_tabs", async () => {
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
    expect(screen.getByRole("button", { name: "Save brand site" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Save center template" })).toBeDefined();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
