import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BrandMerchandisePage } from "./BrandMerchandisePage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("./BrandMerchandiseCatalogSection", () => ({
  BrandMerchandiseCatalogSection: () => <div data-testid="catalog-section">Catalog section</div>,
}));

vi.mock("./BrandMerchandisePromoSection", () => ({
  BrandMerchandisePromoSection: () => null,
}));

vi.mock("./BrandMerchandiseOrdersSection", () => ({
  BrandMerchandiseOrdersSection: () => null,
}));

vi.mock("./BrandMerchandisePaymentSettings", () => ({
  BrandMerchandisePaymentSettings: () => null,
}));

vi.mock("@/features/brand/kits/BrandCompetitionsSection", () => ({
  BrandCompetitionsSection: () => null,
}));

describe("BrandMerchandisePage", () => {
  it("regression_renders_merchandise_catalog_header_and_tabs", () => {
    render(
      <MemoryRouter>
        <BrandMerchandisePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Merchandise Catalog", level: 1 })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Catalog", level: 1 })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Store" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Catalog" })).toBeDefined();
    expect(screen.getByRole("button", { name: "+ Add catalog item" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Promo Codes" })).toBeDefined();
    expect(screen.getByTestId("catalog-section")).toBeDefined();
  });
});
