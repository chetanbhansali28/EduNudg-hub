import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { CenterMerchandiseOrdersPage } from "./CenterMerchandiseOrdersPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", centerId: "center-1", brandSlug: "spark" }),
}));

vi.mock("@/lib/merchandiseOrdersApi", () => ({
  listActiveMerchandiseCatalog: vi.fn().mockResolvedValue([
    {
      id: "item-1",
      sku: "AB-01",
      name: "Abacus kit",
      price_cents: 150000,
      currency: "INR",
      photo_urls: ["https://cdn/kit.jpg"],
    },
  ]),
  listCenterMerchandiseOrders: vi.fn().mockResolvedValue([
    {
      id: "ad2146fc-1234-5678-9abc-def012345678",
      status: "placed",
      payment_status: "unpaid",
      payment_method: "invoice",
      // Within last-30-days order history window (relative so the suite stays green)
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      center_id: "center-1",
      shipping_mode: "franchise",
      shipping_address: null,
      shipping_tracking: null,
      subtotal_cents: 621000,
      discount_cents: 0,
      total_cents: 621000,
      merchandise_order_lines: [
        {
          id: "line-1",
          quantity: 3,
          unit_price_cents: 103500,
          catalog_item_id: "item-1",
          student_id: null,
          merchandise_catalog: { name: "Level 1 Kit", sku: "L1" },
        },
        {
          id: "line-2",
          quantity: 3,
          unit_price_cents: 103500,
          catalog_item_id: "item-2",
          student_id: null,
          merchandise_catalog: { name: "Level 2 Kit", sku: "L2" },
        },
      ],
      merchandise_invoices: {
        id: "inv-1",
        invoice_number: "MER-2026-00001",
        status: "sent",
        due_at: "2026-06-22T00:00:00Z",
      },
    },
  ]),
  listCenterMerchandiseAllocations: vi.fn().mockResolvedValue([]),
  listFulfillableMerchandiseOrderLines: vi.fn().mockResolvedValue([]),
  validateMerchandisePromoCode: vi.fn(),
  createCenterMerchandiseOrder: vi.fn(),
}));

vi.mock("@/lib/merchandiseRemindersApi", () => ({
  listCenterMerchandisePaymentAlerts: vi.fn().mockResolvedValue({
    unpaid_count: 1,
    unpaid_total_cents: 621000,
    overdue_count: 0,
  }),
}));

vi.mock("@/lib/merchandiseSettingsApi", () => ({
  fetchMerchandiseBrandSettings: vi.fn().mockResolvedValue({ payment_mode: "both" }),
}));

vi.mock("@/lib/centerInventoryApi", () => ({
  fetchCenterInventorySummary: vi.fn().mockResolvedValue([
    {
      catalogItemId: "item-1",
      sku: "L1",
      name: "Level 1 Kit",
      priceCents: 10000,
      photoUrl: null,
      onHand: 12,
      incoming: 0,
      allocated: 0,
      available: 12,
    },
    {
      catalogItemId: "item-2",
      sku: "L2",
      name: "Level 2 Kit",
      priceCents: 10000,
      photoUrl: null,
      onHand: 12,
      incoming: 0,
      allocated: 0,
      available: 12,
    },
  ]),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("./CenterMerchandiseMobileChrome", () => ({
  CenterMerchandiseMobileChrome: () => null,
}));

describe("CenterMerchandiseOrdersPage", () => {
  it("regression_center_merchandise_shop_tab_shows_product_grid", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <MemoryRouter initialEntries={["/app/merchandise"]}>
            <CenterMerchandiseOrdersPage />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("Merchandise Orders")).toBeDefined();
    expect(screen.getByText(/Track and manage kit orders for your center/i)).toBeDefined();
    expect(screen.getByRole("tab", { name: "Shop" })).toBeDefined();
    expect(await screen.findByText("Abacus kit")).toBeDefined();
    expect(screen.getByText("Your Order")).toBeDefined();
  });

  it("regression_center_merchandise_orders_tab_matches_commerce_theme", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <MemoryRouter initialEntries={["/app/merchandise?tab=orders"]}>
            <CenterMerchandiseOrdersPage />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Order History")).toBeDefined();
    expect(screen.getByText("Last 30 Days")).toBeDefined();
    expect(await screen.findByText("Order #ad2146fc")).toBeDefined();
    expect(screen.getByText("MER-2026-00001")).toBeDefined();
    expect(screen.getByText("Allocate Stock")).toBeDefined();
    expect(screen.getByText("Shipping Directory")).toBeDefined();
    expect(await screen.findByText("24 kits")).toBeDefined();
    expect(await screen.findByText("Pay Now")).toBeDefined();
    expect(document.querySelector(".ed-commerce-workspace")).toBeTruthy();
  });
});
