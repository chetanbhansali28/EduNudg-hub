import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BrandSettingsPage } from "./BrandSettingsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => {
            if (table === "brands") {
              return Promise.resolve({
                data: { id: "brand-1", logo_url: null, name: "Abacus World" },
                error: null,
              });
            }
            return Promise.resolve({
              data: {
                id: "s1",
                settings: {
                  login_headline: "Welcome to the Learning Hub",
                  lead_stale_days: 15,
                  timezone: "Asia/Kolkata",
                },
                updated_at: "2026-06-22T10:00:00Z",
              },
              error: null,
            });
          },
        }),
      }),
    }),
  }),
}));

vi.mock("./BrandLogoUpload", () => ({
  BrandLogoUpload: () => <div>Logo upload</div>,
}));

vi.mock("@/features/brand/settings/BrandLegalDocumentsSection", () => ({
  BrandLegalDocumentsSection: () => <div>Legal documents</div>,
}));

describe("BrandSettingsPage", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("1024"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("regression_brand_settings_omits_features_section", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BrandSettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByText("Brand Configuration")).toBeDefined();
    expect(await screen.findByText(/Active Entity:/)).toBeDefined();
    expect(screen.getByText("White-label & Login Copy")).toBeDefined();
    expect(screen.queryByText("Merchandise catalog & orders")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Features" })).toBeNull();
    expect(screen.queryByText("Theme")).toBeNull();
  });
});
