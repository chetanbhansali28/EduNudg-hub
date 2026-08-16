import { describe, expect, it } from "vitest";
import { DEFAULT_MERCHANDISE_SETTINGS } from "@/lib/merchandiseSettingsApi";
import type { MerchandiseOrderRow } from "@/lib/merchandiseOrdersApi";
import {
  filterMerchandiseCatalog,
  filterMerchandiseOrders,
  filterMerchandisePaymentGroups,
  filterMerchandisePromos,
  matchesMerchandiseSearch,
  merchandiseCatalogCounts,
  merchandiseOrderCenterLabel,
  merchandisePageCounts,
  merchandisePaymentSettingGroups,
  merchandiseSearchPlaceholder,
} from "./merchandisePageHelpers";

const kit = { sku: "KIT001", name: "Level 1 Kit", is_active: true };
const workbook = { sku: "WB-DRAFT", name: "Workbook draft", is_active: false };

const summerPromo = {
  id: "promo-1",
  code: "SUMMER20",
  description: "Summer sale",
  discount_type: "percent" as const,
  discount_value: 20,
  min_quantity: 1,
  max_uses: 50,
  use_count: 3,
  is_active: true,
};

const draftPromo = {
  id: "promo-2",
  code: "DRAFT10",
  description: null,
  discount_type: "fixed" as const,
  discount_value: 10000,
  min_quantity: 2,
  max_uses: null,
  use_count: 0,
  is_active: false,
};

function order(partial: Partial<MerchandiseOrderRow> = {}): MerchandiseOrderRow {
  return {
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
      due_at: new Date(Date.now() - 86_400_000).toISOString(),
    },
    ...partial,
  };
}

describe("merchandisePageHelpers", () => {
  it("counts active, draft, and total catalog items", () => {
    expect(merchandiseCatalogCounts([kit, workbook])).toEqual({ active: 1, draft: 1, total: 2 });
  });

  it("includes franchise order count on the page stats strip", () => {
    expect(merchandisePageCounts([kit, workbook], 3)).toEqual({
      active: 1,
      draft: 1,
      total: 2,
      orders: 3,
    });
  });

  it("filters catalog by active/draft tab and search", () => {
    expect(filterMerchandiseCatalog([kit, workbook], "active")).toEqual([kit]);
    expect(filterMerchandiseCatalog([kit, workbook], "draft")).toEqual([workbook]);
    expect(filterMerchandiseCatalog([kit, workbook], "all", "workbook")).toEqual([workbook]);
    expect(matchesMerchandiseSearch(kit, "KIT001")).toBe(true);
    expect(matchesMerchandiseSearch(kit, "missing")).toBe(false);
  });

  it("filters promo codes by code, description, and status", () => {
    expect(filterMerchandisePromos([summerPromo, draftPromo], "summer")).toEqual([summerPromo]);
    expect(filterMerchandisePromos([summerPromo, draftPromo], "inactive")).toEqual([draftPromo]);
    expect(filterMerchandisePromos([summerPromo, draftPromo], "missing")).toEqual([]);
  });

  it("filters orders by center name, status, and overdue invoices", () => {
    const paid = order({
      id: "order-2",
      franchise_centers: { name: "Mumbai Center", display_name: "Mumbai Center" },
      payment_status: "paid",
      status: "approved",
      merchandise_invoices: {
        id: "inv-2",
        invoice_number: "INV-200",
        status: "paid",
        due_at: "2026-08-10T00:00:00.000Z",
      },
    });
    expect(merchandiseOrderCenterLabel(order())).toBe("Pune Center");
    expect(filterMerchandiseOrders([order(), paid], "mumbai")).toEqual([paid]);
    expect(filterMerchandiseOrders([order(), paid], "", true).map((row) => row.id)).toEqual(["order-1"]);
  });

  it("builds searchable payment-setting groups from brand merchandise settings", () => {
    const groups = merchandisePaymentSettingGroups({
      ...DEFAULT_MERCHANDISE_SETTINGS,
      razorpay_key_id: "rzp_test_123",
    });
    expect(groups.map((group) => group.id)).toEqual(["mode", "razorpay", "invoice", "reminders"]);
    expect(filterMerchandisePaymentGroups(groups, "rzp_test_123")[0]?.id).toBe("razorpay");
    expect(filterMerchandisePaymentGroups(groups, "upi")[0]?.id).toBe("invoice");
    expect(filterMerchandisePaymentGroups(groups, "missing")).toEqual([]);
    expect(merchandiseSearchPlaceholder("promo")).toBe("Search promo codes...");
  });
});
