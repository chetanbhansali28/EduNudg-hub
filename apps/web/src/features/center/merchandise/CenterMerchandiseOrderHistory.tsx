import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, CommerceArchiveNote, CommerceOrderCard, CommerceSectionHeader } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  listCenterMerchandiseOrders,
  markMerchandiseOrderReceived,
  type MerchandiseOrderRow,
} from "@/lib/merchandiseOrdersApi";
import {
  confirmMerchandiseRazorpayPayment,
  startMerchandiseRazorpayCheckout,
} from "@/services/payments/merchandiseCheckout";
import { openRazorpayCheckout } from "@/services/payments/razorpayGateway";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { fetchMerchandiseBrandSettings } from "@/lib/merchandiseSettingsApi";
import {
  filterMerchandiseOrdersSince,
  formatMerchandiseOrderLabel,
  hasOlderMerchandiseOrders,
  merchandiseOrderStatusBadge,
} from "@/lib/merchandiseOrdersHelpers";

type Props = {
  centerId: string;
  brandId: string;
  brandSlug?: string | null;
};

function orderInvoice(order: MerchandiseOrderRow) {
  const inv = order.merchandise_invoices;
  if (!inv) return null;
  return Array.isArray(inv) ? inv[0] : inv;
}

function orderTracking(order: MerchandiseOrderRow): Record<string, unknown> | null {
  const t = order.shipping_tracking;
  if (!t || typeof t !== "object") return null;
  return t as Record<string, unknown>;
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return <span className={`ed-commerce-status-badge ed-commerce-status-badge--${tone}`}>{label}</span>;
}

export function CenterMerchandiseOrderHistory({ centerId, brandId, brandSlug }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["center-merchandise-orders", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterMerchandiseOrders(centerId),
  });

  const brandSettings = useQuery({
    queryKey: ["merchandise-brand-settings", brandId],
    enabled: !!brandId,
    queryFn: () => fetchMerchandiseBrandSettings(brandId),
  });

  const payWithRazorpay = async (order: MerchandiseOrderRow) => {
    const { data, error: checkoutErr } = await startMerchandiseRazorpayCheckout(order.id);
    if (checkoutErr) throw new Error(checkoutErr);
    if (data?.status === "stub") throw new Error(String(data.message ?? "Razorpay is not configured."));
    const keyId = String(data?.razorpay_key_id ?? brandSettings.data?.razorpay_key_id ?? "");
    const razorpayOrderId = String(data?.razorpay_order_id ?? "");
    if (!keyId || !razorpayOrderId) throw new Error("Unable to start Razorpay checkout");
    await openRazorpayCheckout({
      keyId,
      orderId: order.id,
      razorpayOrderId,
      amountCents: order.total_cents,
      currency: "INR",
      name: brandSlug ?? "Merchandise",
      description: `Order ${order.id.slice(0, 8)}`,
      onSuccess: async (paymentId) => {
        await confirmMerchandiseRazorpayPayment(order.id, paymentId, razorpayOrderId, order.total_cents);
        void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] });
        void qc.invalidateQueries({ queryKey: ["center-merchandise-payment-alerts", centerId] });
      },
    });
  };

  const markReceived = useMutation({
    mutationFn: (orderId: string) => markMerchandiseOrderReceived(orderId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-inventory-summary"] });
    },
    onError: capture,
  });

  const retryPayment = useMutation({
    mutationFn: async (order: MerchandiseOrderRow) => {
      clear();
      await payWithRazorpay(order);
    },
    onError: capture,
  });

  const allOrders = orders.data ?? [];
  const recentOrders = filterMerchandiseOrdersSince(allOrders, 1);
  const showArchive = hasOlderMerchandiseOrders(allOrders, 1);

  return (
    <section aria-label="Order history">
      <CommerceSectionHeader title="Order History" badge="Last 30 Days" />
      {error ? (
        <p className="ed-text-sm" style={{ color: "var(--ed-danger)" }}>
          {error}
        </p>
      ) : null}
      {orders.isLoading ? <p className="ed-text-sm ed-muted">Loading orders…</p> : null}
      {!orders.isLoading && recentOrders.length === 0 ? (
        <p className="ed-commerce-archive-note__text">No merchandise orders yet.</p>
      ) : null}
      {recentOrders.map((order) => {
        const invoice = orderInvoice(order);
        const tracking = orderTracking(order);
        const orderStatus = merchandiseOrderStatusBadge(order.status);
        const paymentStatus = merchandiseOrderStatusBadge(order.payment_status);
        const canMarkReceived = order.status === "shipped";
        const canPay =
          order.payment_method === "razorpay" &&
          (order.payment_status === "unpaid" ||
            order.payment_status === "pending" ||
            order.status === "awaiting_payment");
        const expanded = expandedOrderId === order.id;

        const dueLabel = invoice
          ? `due ${new Date(invoice.due_at).toLocaleDateString()}`
          : undefined;
        const dueTone =
          invoice && new Date(invoice.due_at).getTime() < Date.now() ? "danger" : "default";

        return (
          <CommerceOrderCard
            key={order.id}
            orderLabel={formatMerchandiseOrderLabel(order.id)}
            statusBadges={
              <>
                <StatusBadge label={orderStatus.label} tone={orderStatus.tone} />
                <StatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
              </>
            }
            placedAt={new Date(order.created_at).toLocaleString()}
            invoiceNumber={invoice?.invoice_number}
            lines={order.merchandise_order_lines?.map((line) => {
              const catalogItem = Array.isArray(line.merchandise_catalog)
                ? line.merchandise_catalog[0]
                : line.merchandise_catalog;
              return (
                <li key={line.id}>
                  {catalogItem?.name ?? "Item"} x {line.quantity}
                </li>
              );
            })}
            totalLabel={`Total: ${formatInrFromPaise(order.total_cents)}`}
            dueLabel={dueLabel}
            dueTone={dueTone}
            footer={
              <Button
                variant={expanded ? "secondary" : "primary"}
                onClick={() => setExpandedOrderId(expanded ? null : order.id)}
              >
                Details
              </Button>
            }
            expanded={
              expanded ? (
                <>
                  {tracking?.tracking_number ? (
                    <p className="ed-text-sm ed-muted">Tracking: {String(tracking.tracking_number)}</p>
                  ) : null}
                  {canPay ? (
                    <Button
                      variant="primary"
                      onClick={() => retryPayment.mutate(order)}
                      disabled={retryPayment.isPending}
                    >
                      Pay now
                    </Button>
                  ) : null}
                  {canMarkReceived ? (
                    <Button
                      variant="secondary"
                      onClick={() => markReceived.mutate(order.id)}
                      disabled={markReceived.isPending}
                    >
                      Mark received
                    </Button>
                  ) : null}
                </>
              ) : undefined
            }
          />
        );
      })}
      {showArchive ? <CommerceArchiveNote /> : null}
    </section>
  );
}
