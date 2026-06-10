import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  listCenterMerchandiseOrders: vi.fn().mockResolvedValue([]),
  validateMerchandisePromoCode: vi.fn(),
  createCenterMerchandiseOrder: vi.fn(),
}));

vi.mock("@/lib/merchandiseRemindersApi", () => ({
  listCenterMerchandisePaymentAlerts: vi.fn().mockResolvedValue({
    unpaid_count: 0,
    unpaid_total_cents: 0,
    overdue_count: 0,
  }),
}));

vi.mock("@/lib/merchandiseSettingsApi", () => ({
  fetchMerchandiseBrandSettings: vi.fn().mockResolvedValue({ payment_mode: "both" }),
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

vi.mock("./CenterMerchandiseAllocationsCard", () => ({
  CenterMerchandiseAllocationsCard: () => <div>Allocations</div>,
}));

vi.mock("./CenterStudentProfileAddressCard", () => ({
  CenterStudentProfileAddressCard: () => <div>Student addresses</div>,
}));

describe("CenterMerchandiseOrdersPage", () => {
  it("regression_center_merchandise_shop_tab_shows_product_grid", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterMerchandiseOrdersPage />
      </QueryClientProvider>
    );

    expect(screen.getByText("Merchandise")).toBeDefined();
    expect(screen.getByRole("button", { name: "Shop" })).toBeDefined();
    expect(await screen.findByText("Abacus kit")).toBeDefined();
    expect(screen.getByText("Your order")).toBeDefined();
  });
});
