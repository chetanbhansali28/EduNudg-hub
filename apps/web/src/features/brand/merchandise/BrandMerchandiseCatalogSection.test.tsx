import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMerchandiseCatalogSection } from "./BrandMerchandiseCatalogSection";

vi.mock("@/lib/merchandiseOrdersApi", () => ({
  upsertMerchandiseCatalogItem: vi.fn(),
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
                  sku: "AB-01",
                  name: "Abacus kit",
                  price_cents: 150000,
                  currency: "INR",
                  is_active: true,
                  photo_urls: [],
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
  it("regression_brand_catalog_lists_items_with_photo_upload", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandiseCatalogSection brandId="brand-1" />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Abacus kit")).toBeDefined();
    expect(screen.getByTestId("product-photos")).toBeDefined();
    expect(screen.getByText("Catalog items")).toBeDefined();
  });
});
