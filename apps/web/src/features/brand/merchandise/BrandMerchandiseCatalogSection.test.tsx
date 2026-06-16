import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMerchandiseCatalogSection } from "./BrandMerchandiseCatalogSection";

vi.mock("@/lib/merchandiseOrdersApi", () => ({
  upsertMerchandiseCatalogItem: vi.fn().mockResolvedValue("new-item-id"),
  deleteMerchandiseCatalogItem: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [
                {
                  id: "item-1",
                  sku: "KIT001",
                  name: "Level 1 Kit",
                  price_cents: 105000,
                  currency: "INR",
                  is_active: true,
                  photo_urls: ["https://cdn.example/photo-1.jpg"],
                },
              ],
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

vi.mock("./MerchandiseProductPhotos", () => ({
  MerchandiseProductPhotos: () => <div data-testid="product-photos">Photos</div>,
}));

describe("BrandMerchandiseCatalogSection", () => {
  it("regression_brand_catalog_renders_mockup_product_cards", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandiseCatalogSection
          brandId="brand-1"
          formOpen={false}
          onFormOpenChange={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Level 1 Kit")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Edit Details")).toBeDefined();
    expect(screen.getByText("Product Assets (1/5 uploaded)")).toBeDefined();
    expect(screen.getByRole("button", { name: "Manage Gallery" })).toBeDefined();
    expect(screen.getByTestId("product-photos")).toBeDefined();
  });

  it("regression_add_catalog_panel_shows_below_tabs_when_open", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandiseCatalogSection
          brandId="brand-1"
          formOpen
          onFormOpenChange={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Add catalog item", level: 2 })).toBeDefined();
    expect(screen.getByLabelText("SKU")).toBeDefined();
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Price (₹)")).toBeDefined();
    expect(screen.getByLabelText("Currency")).toBeDefined();
    expect(screen.getByRole("switch", { name: "Active" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Add item" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    expect(screen.getByText(/Product photos can be added after the catalog item is saved/)).toBeDefined();
  });
});
