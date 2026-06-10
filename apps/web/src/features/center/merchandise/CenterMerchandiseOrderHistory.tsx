import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, ListRow } from "@edunudg/ui";
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

type Props = {
  centerId: string;
  brandId: string;
  brandSlug?: string | null;
};

function paymentBadgeTone(status: string): "default" | "success" | "warning" {
  if (status === "paid") return "success";
  if (status === "unpaid" || status === "pending" || status === "failed") return "warning";
  return "default";
}

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

export function CenterMerchandiseOrderHistory({ centerId, brandId, brandSlug }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

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
      },
    });
  };

  const markReceived = useMutation({
    mutationFn: (orderId: string) => markMerchandiseOrderReceived(orderId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] }),
    onError: capture,
  });

  const retryPayment = useMutation({
    mutationFn: async (order: MerchandiseOrderRow) => {
      clear();
      await payWithRazorpay(order);
    },
    onError: capture,
  });

  return (
    <Card title="Order history">
      {error ? <p className="ed-text-sm" style={{ color: "var(--ed-danger)" }}>{error}</p> : null}
      <DataList
        items={orders.data ?? []}
        empty="No merchandise orders yet."
        render={(o) => {
          const invoice = orderInvoice(o);
          const tracking = orderTracking(o);
          const canMarkReceived = o.status === "shipped";
          const canPay =
            o.payment_method === "razorpay" &&
            (o.payment_status === "unpaid" || o.payment_status === "pending" || o.status === "awaiting_payment");

          return (
            <ListRow
              aside={
                <>
                  {canPay ? (
                    <Button variant="ghost" onClick={() => retryPayment.mutate(o)} disabled={retryPayment.isPending}>
                      Pay now
                    </Button>
                  ) : null}
                  {canMarkReceived ? (
                    <Button variant="ghost" onClick={() => markReceived.mutate(o.id)} disabled={markReceived.isPending}>
                      Mark received
                    </Button>
                  ) : null}
                </>
              }
            >
              <div>
                <strong>Order {o.id.slice(0, 8)}</strong>
                <div className="ed-text-sm ed-muted">{new Date(o.created_at).toLocaleString()}</div>
                <div className="ed-text-sm">
                  <Badge>{o.status}</Badge>{" "}
                  <Badge tone={paymentBadgeTone(o.payment_status)}>{o.payment_status}</Badge>
                </div>
                <ul className="ed-text-sm">
                  {o.merchandise_order_lines?.map((line) => {
                    const catalogItem = Array.isArray(line.merchandise_catalog)
                      ? line.merchandise_catalog[0]
                      : line.merchandise_catalog;
                    return (
                      <li key={line.id}>
                        {catalogItem?.name ?? "Item"} × {line.quantity}
                        {line.student_id ? " (student)" : ""}
                      </li>
                    );
                  })}
                </ul>
                <p className="ed-text-sm ed-muted">Total: {formatInrFromPaise(o.total_cents)}</p>
                {tracking?.tracking_number ? (
                  <p className="ed-text-sm ed-muted">Tracking: {String(tracking.tracking_number)}</p>
                ) : null}
                {invoice ? (
                  <p className="ed-text-sm ed-muted">
                    Invoice {invoice.invoice_number} — due {new Date(invoice.due_at).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </ListRow>
          );
        }}
      />
    </Card>
  );
}
