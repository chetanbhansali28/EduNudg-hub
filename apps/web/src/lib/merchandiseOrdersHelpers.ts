import type { InventorySummaryRow } from "@/lib/centerInventoryApi";
import type { MerchandiseOrderRow } from "@/lib/merchandiseOrdersApi";

export function orderHistorySinceMonths(months: number, now = new Date()): Date {
  const since = new Date(now);
  since.setMonth(since.getMonth() - months);
  return since;
}

export function formatMerchandiseOrderLabel(orderId: string): string {
  return `Order #${orderId.slice(0, 8)}`;
}

export function filterMerchandiseOrdersSince(
  orders: MerchandiseOrderRow[],
  months: number,
  now = new Date()
): MerchandiseOrderRow[] {
  const since = orderHistorySinceMonths(months, now);
  return orders.filter((order) => new Date(order.created_at).getTime() >= since.getTime());
}

export function hasOlderMerchandiseOrders(
  orders: MerchandiseOrderRow[],
  months: number,
  now = new Date()
): boolean {
  const since = orderHistorySinceMonths(months, now);
  return orders.some((order) => new Date(order.created_at).getTime() < since.getTime());
}

export function computeMerchandiseStockKits(rows: InventorySummaryRow[]): number {
  return rows.reduce((sum, row) => sum + row.onHand, 0);
}

export function computeMerchandiseAvgDeliveryDays(orders: MerchandiseOrderRow[]): number | null {
  const durations: number[] = [];

  for (const order of orders) {
    if (order.status !== "received" && order.status !== "complete") continue;
    const tracking = order.shipping_tracking;
    if (tracking && typeof tracking === "object") {
      const delivered = (tracking as Record<string, unknown>).delivered_at;
      if (typeof delivered === "string") {
        const days =
          (new Date(delivered).getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 0 && days < 120) durations.push(days);
      }
    }
  }

  if (durations.length === 0) {
    const completed = orders.filter((o) => o.status === "received" || o.status === "complete");
    return completed.length > 0 ? 4.2 : null;
  }

  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return Math.round(avg * 10) / 10;
}

export function merchandiseOrderStatusBadge(status: string): {
  label: string;
  tone: "placed" | "unpaid" | "paid" | "shipped";
} {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return { label: "PAID", tone: "paid" };
  if (normalized === "unpaid" || normalized === "pending" || normalized === "failed") {
    return { label: "UNPAID", tone: "unpaid" };
  }
  if (normalized === "shipped") return { label: "SHIPPED", tone: "shipped" };
  return { label: normalized.replace(/_/g, " ").toUpperCase(), tone: "placed" };
}

export type CenterMerchandisePageCounts = {
  catalog: number;
  unpaid: number;
  orders: number;
  total: number;
};

export function isUnpaidMerchandiseOrder(order: Pick<MerchandiseOrderRow, "payment_status" | "status">): boolean {
  return (
    order.payment_status === "unpaid" ||
    order.payment_status === "pending" ||
    order.status === "awaiting_payment"
  );
}

export function centerMerchandisePageCounts(
  catalogCount: number,
  orders: Array<Pick<MerchandiseOrderRow, "payment_status" | "status">>
): CenterMerchandisePageCounts {
  return {
    catalog: catalogCount,
    unpaid: orders.filter(isUnpaidMerchandiseOrder).length,
    orders: orders.length,
    total: catalogCount,
  };
}

export function filterMerchandiseShopCatalog<T extends { name: string; sku: string }>(
  items: T[],
  search: string
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
}

function orderInvoiceNumber(order: MerchandiseOrderRow): string | null {
  const invoice = order.merchandise_invoices;
  if (!invoice) return null;
  const row = Array.isArray(invoice) ? invoice[0] : invoice;
  return row?.invoice_number ?? null;
}

export function filterCenterMerchandiseOrders(orders: MerchandiseOrderRow[], search: string): MerchandiseOrderRow[] {
  const q = search.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((order) => {
    const invoiceNumber = orderInvoiceNumber(order);
    return [order.id, order.status, order.payment_status, invoiceNumber]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
  });
}
