import { describe, expect, it } from "vitest";
import {
  computeMerchandiseAvgDeliveryDays,
  computeMerchandiseStockKits,
  filterMerchandiseOrdersSince,
  formatMerchandiseOrderLabel,
  hasOlderMerchandiseOrders,
  merchandiseOrderStatusBadge,
} from "@/lib/merchandiseOrdersHelpers";
import type { MerchandiseOrderRow } from "@/lib/merchandiseOrdersApi";

const sampleOrder = (overrides: Partial<MerchandiseOrderRow> = {}): MerchandiseOrderRow => ({
  id: "ad2146fc-1234-5678-9abc-def012345678",
  status: "placed",
  payment_status: "unpaid",
  payment_method: "invoice",
  created_at: "2026-06-15T18:00:00Z",
  center_id: "center-1",
  shipping_mode: "franchise",
  shipping_address: null,
  shipping_tracking: null,
  subtotal_cents: 621000,
  discount_cents: 0,
  total_cents: 621000,
  merchandise_order_lines: [],
  ...overrides,
});

describe("merchandiseOrdersHelpers", () => {
  it("formatMerchandiseOrderLabel shortens order id", () => {
    expect(formatMerchandiseOrderLabel("ad2146fc-1234")).toBe("Order #ad2146fc");
  });

  it("filterMerchandiseOrdersSince keeps recent orders", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const orders = [
      sampleOrder({ created_at: "2026-06-01T12:00:00Z" }),
      sampleOrder({ id: "old", created_at: "2025-01-01T12:00:00Z" }),
    ];
    const recent = filterMerchandiseOrdersSince(orders, 1, now);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.id).toContain("ad2146fc");
  });

  it("hasOlderMerchandiseOrders detects archive candidates", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    expect(hasOlderMerchandiseOrders([sampleOrder({ created_at: "2025-01-01T12:00:00Z" })], 1, now)).toBe(
      true
    );
  });

  it("computeMerchandiseStockKits sums on-hand quantities", () => {
    expect(
      computeMerchandiseStockKits([
        {
          catalogItemId: "a",
          sku: "K1",
          name: "Kit",
          priceCents: 100,
          photoUrl: null,
          onHand: 10,
          incoming: 0,
          allocated: 0,
          available: 10,
        },
        {
          catalogItemId: "b",
          sku: "K2",
          name: "Kit 2",
          priceCents: 100,
          photoUrl: null,
          onHand: 14,
          incoming: 0,
          allocated: 0,
          available: 14,
        },
      ])
    ).toBe(24);
  });

  it("computeMerchandiseAvgDeliveryDays uses delivered tracking when present", () => {
    const avg = computeMerchandiseAvgDeliveryDays([
      sampleOrder({
        status: "received",
        created_at: "2026-06-01T12:00:00Z",
        shipping_tracking: { delivered_at: "2026-06-05T12:00:00Z" },
      }),
    ]);
    expect(avg).toBe(4);
  });

  it("merchandiseOrderStatusBadge maps unpaid payment status", () => {
    expect(merchandiseOrderStatusBadge("unpaid")).toEqual({ label: "UNPAID", tone: "unpaid" });
    expect(merchandiseOrderStatusBadge("placed")).toEqual({ label: "PLACED", tone: "placed" });
  });
});
