import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMerchandisePromoSection } from "./BrandMerchandisePromoSection";

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/merchandiseOrdersApi", () => ({
  upsertMerchandisePromoCode: vi.fn().mockResolvedValue("promo-1"),
  listMerchandisePromoCodes: vi.fn().mockResolvedValue([
    {
      id: "promo-1",
      code: "SUMMER20",
      description: "Summer sale",
      discount_type: "percent",
      discount_value: 20,
      min_quantity: 1,
      max_uses: 50,
      use_count: 3,
      is_active: true,
    },
  ]),
}));

describe("BrandMerchandisePromoSection", () => {
  it("regression_merchandise_promo_tab_uses_catalog_pipeline_workspace", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandisePromoSection brandId="brand-1" />
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText("SUMMER20")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("Edit Details")).toBeDefined();
    expect(screen.getAllByText("20% off").length).toBeGreaterThan(0);
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(document.querySelectorAll(".ed-franchise-app-list-item")).toHaveLength(1);
    expect(document.querySelector(".ed-franchise-app-list-item--selected")).toBeTruthy();
  });

  it("regression_add_promo_panel_shows_in_detail_when_open", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandisePromoSection brandId="brand-1" formOpen onFormOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Add promo code", level: 2 })).toBeDefined();
    expect(screen.getByLabelText("Code")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add promo code" })).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
  });
});
