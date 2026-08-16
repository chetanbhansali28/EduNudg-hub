import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMerchandiseOrdersSection } from "./BrandMerchandiseOrdersSection";

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/merchandiseOrdersApi", () => ({
  listBrandMerchandiseOrders: vi.fn().mockResolvedValue([
    {
      id: "order-1",
      status: "placed",
      payment_status: "pending",
      payment_method: "invoice",
      created_at: "2026-08-01T10:00:00.000Z",
      center_id: "center-1",
      shipping_mode: "franchise",
      shipping_address: null,
      shipping_tracking: null,
      subtotal_cents: 105000,
      discount_cents: 0,
      total_cents: 105000,
      franchise_centers: { name: "Pune Center", display_name: "Pune Center" },
      merchandise_order_lines: [
        {
          id: "line-1",
          quantity: 2,
          unit_price_cents: 52500,
          catalog_item_id: "item-1",
          student_id: null,
          merchandise_catalog: { name: "Level 1 Kit", sku: "KIT001" },
        },
      ],
      merchandise_invoices: {
        id: "inv-1",
        invoice_number: "INV-100",
        status: "open",
        due_at: "2026-08-10T00:00:00.000Z",
      },
    },
  ]),
  updateMerchandiseOrderStatus: vi.fn(),
  recordMerchandisePayment: vi.fn(),
  completeMerchandiseOrder: vi.fn(),
}));

describe("BrandMerchandiseOrdersSection", () => {
  it("regression_merchandise_orders_tab_uses_catalog_pipeline_workspace", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandiseOrdersSection brandId="brand-1" />
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText("Pune Center")).length).toBeGreaterThan(0);
    expect(screen.getByText("Overdue payments only")).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(document.querySelectorAll(".ed-franchise-app-list-item")).toHaveLength(1);
    await waitFor(() => {
      expect(document.querySelector(".ed-franchise-app-list-item--selected")).toBeTruthy();
    });
  });
});
