import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandSettingsPage } from "./BrandSettingsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { id: "s1", settings: {} },
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

vi.mock("./BrandLogoUpload", () => ({
  BrandLogoUpload: () => <div>Logo upload</div>,
}));

describe("BrandSettingsPage", () => {
  it("regression_brand_settings_omits_features_section", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandSettingsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Brand Settings")).toBeDefined();
    expect(screen.queryByText("Merchandise catalog & orders")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Features" })).toBeNull();
  });
});
