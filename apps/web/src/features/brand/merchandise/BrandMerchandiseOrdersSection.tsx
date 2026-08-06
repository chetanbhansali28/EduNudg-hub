import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  FormGrid,
  Input,
  MutationError,
  Select,
  ToggleField,
} from "@edunudg/ui";
import {
  completeMerchandiseOrder,
  listBrandMerchandiseOrders,
  recordMerchandisePayment,
  type MerchandiseOrderRow,
  updateMerchandiseOrderStatus,
} from "@/lib/merchandiseOrdersApi";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string };

type InvoiceSnapshot = {
  id: string;
  invoice_number: string;
  status: string;
  due_at: string;
};

type OrderEditForm = {
  status: string;
  carrier: string;
  trackingNumber: string;
};

const BRAND_EDITABLE_STATUSES = [
  { value: "placed", label: "placed" },
  { value: "approved", label: "approved" },
  { value: "shipped", label: "shipped" },
  { value: "cancelled", label: "cancelled" },
] as const;

function centerLabel(order: MerchandiseOrderRow): string {
  const center = Array.isArray(order.franchise_centers)
    ? order.franchise_centers[0]
    : order.franchise_centers;
  return center?.display_name ?? center?.name ?? order.center_id.slice(0, 8);
}

function firstInvoice(order: MerchandiseOrderRow): InvoiceSnapshot | null {
  const inv = order.merchandise_invoices;
  if (!inv) return null;
  return (Array.isArray(inv) ? inv[0] : inv) ?? null;
}

function lineLabel(line: MerchandiseOrderRow["merchandise_order_lines"][number]): string {
  const catalog = Array.isArray(line.merchandise_catalog)
    ? line.merchandise_catalog[0]
    : line.merchandise_catalog;
  return `${catalog?.name ?? "Item"} × ${line.quantity} (${formatInrFromPaise(line.unit_price_cents)} each)`;
}

function isOverduePayment(order: MerchandiseOrderRow): boolean {
  if (order.payment_status === "paid") return false;
  const inv = firstInvoice(order);
  if (!inv || inv.status === "paid") return false;
  return new Date(inv.due_at) < new Date();
}

function paymentBadgeTone(status: string): "success" | "warning" | "default" {
  if (status === "paid") return "success";
  if (status === "pending" || status === "awaiting") return "warning";
  return "default";
}

function trackingFields(order: MerchandiseOrderRow): { carrier: string; trackingNumber: string } {
  const tracking = order.shipping_tracking ?? {};
  return {
    carrier: typeof tracking.carrier === "string" ? tracking.carrier : "",
    trackingNumber: typeof tracking.tracking_number === "string" ? tracking.tracking_number : "",
  };
}

function orderToEditForm(order: MerchandiseOrderRow): OrderEditForm {
  const tracking = trackingFields(order);
  const editableStatus = BRAND_EDITABLE_STATUSES.some((s) => s.value === order.status)
    ? order.status
    : order.status === "awaiting_payment"
      ? "placed"
      : order.status === "received" || order.status === "complete"
        ? "shipped"
        : "placed";
  return {
    status: editableStatus,
    carrier: tracking.carrier,
    trackingNumber: tracking.trackingNumber,
  };
}

export function BrandMerchandiseOrdersSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OrderEditForm>({
    status: "placed",
    carrier: "",
    trackingNumber: "",
  });

  const orders = useQuery({
    queryKey: ["brand-merchandise-orders", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandMerchandiseOrders(brandId),
  });

  const filteredOrders = useMemo(() => {
    const rows = orders.data ?? [];
    return overdueOnly ? rows.filter(isOverduePayment) : rows;
  }, [orders.data, overdueOnly]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["brand-merchandise-orders", brandId] });

  const statusUpdate = useMutation({
    mutationFn: async ({
      orderId,
      status,
      shippingTracking,
    }: {
      orderId: string;
      status: string;
      shippingTracking?: Record<string, unknown>;
    }) => {
      clear();
      await updateMerchandiseOrderStatus(orderId, status, shippingTracking);
    },
    onSuccess: () => {
      invalidate();
      setShippingOrderId(null);
      setCarrier("");
      setTrackingNumber("");
      setEditingId(null);
    },
    onError: capture,
  });

  const markPaid = useMutation({
    mutationFn: async ({ orderId, amountCents }: { orderId: string; amountCents: number }) => {
      clear();
      await recordMerchandisePayment(orderId, amountCents, "invoice", "Marked paid by brand");
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const complete = useMutation({
    mutationFn: async (orderId: string) => {
      clear();
      await completeMerchandiseOrder(orderId);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startShip = (orderId: string) => {
    setEditingId(null);
    setShippingOrderId(orderId);
    setCarrier("");
    setTrackingNumber("");
  };

  const saveEdit = (order: MerchandiseOrderRow) => {
    const nextStatus = editForm.status;
    if (!BRAND_EDITABLE_STATUSES.some((s) => s.value === nextStatus)) {
      capture(new Error("Choose a status of placed, approved, shipped, or cancelled"));
      return;
    }

    const shippingTracking =
      nextStatus === "shipped"
        ? {
            carrier: editForm.carrier.trim(),
            tracking_number: editForm.trackingNumber.trim(),
          }
        : undefined;

    if (nextStatus === "shipped" && !editForm.trackingNumber.trim()) {
      capture(new Error("Tracking number is required when status is shipped"));
      return;
    }

    statusUpdate.mutate({
      orderId: order.id,
      status: nextStatus,
      shippingTracking,
    });
  };

  return (
    <div className="ed-brand-merch-section">
      <MutationError message={error} />

      <section className="ed-brand-merch-section__panel">
        <header className="ed-brand-merch-section__head">
          <div>
            <h2 className="ed-brand-merch-section__title">Center merchandise orders</h2>
            <p className="ed-brand-merch-section__subtitle">
              Review franchise orders, confirm payments, and manage fulfillment.
            </p>
          </div>
        </header>

        <div className="ed-brand-merch-section__body">
          <div className="ed-brand-merch-section__toolbar">
            <ToggleField
              label="Overdue payments only"
              description="Show invoice orders past due date with unpaid balance"
              checked={overdueOnly}
              onChange={setOverdueOnly}
            />
          </div>

          {filteredOrders.length === 0 ? (
            <p className="ed-brand-merch-catalog__empty">
              {overdueOnly ? "No overdue payment orders." : "No merchandise orders yet."}
            </p>
          ) : (
            <div className="ed-brand-merch-section__list">
              {filteredOrders.map((order) => {
                const inv = firstInvoice(order);
                const overdue = isOverduePayment(order);
                const canApprove =
                  order.payment_status === "paid" &&
                  (order.status === "placed" || order.status === "awaiting_payment");
                const canShip = order.status === "approved";
                const canComplete = order.status === "shipped" || order.status === "received";
                const canCancel = !["complete", "cancelled"].includes(order.status);
                const canMarkPaid =
                  order.payment_status !== "paid" &&
                  (order.payment_method === "invoice" || inv != null);
                const showingShipForm = shippingOrderId === order.id;
                const editing = editingId === order.id;
                const tracking = trackingFields(order);

                return (
                  <article key={order.id} className="ed-brand-merch-item">
                    <div className="ed-brand-merch-item__inner">
                      <div className="ed-brand-merch-item__head">
                        <div>
                          <h3 className="ed-brand-merch-item__title">{centerLabel(order)}</h3>
                          <p className="ed-brand-merch-item__meta">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="ed-brand-merch-item__actions">
                          <CrudRowActions
                            editing={editing}
                            onEdit={() => {
                              setShippingOrderId(null);
                              setEditingId(order.id);
                              setEditForm(orderToEditForm(order));
                            }}
                            onSave={() => saveEdit(order)}
                            onCancel={() => setEditingId(null)}
                            onDelete={
                              canCancel
                                ? () =>
                                    statusUpdate.mutate({ orderId: order.id, status: "cancelled" })
                                : undefined
                            }
                            deleteTitle="Cancel order"
                            deleteDescription="This cancels the merchandise order. It cannot be undone from this screen."
                            saveDisabled={statusUpdate.isPending}
                            saveLabel="Save order"
                          />
                        </div>
                      </div>

                      {editing ? (
                        <FormGrid>
                          <Select
                            label="Status"
                            value={editForm.status}
                            onChange={(status) => setEditForm((prev) => ({ ...prev, status }))}
                            options={BRAND_EDITABLE_STATUSES.map((status) => ({
                              value: status.value,
                              label: status.label,
                            }))}
                          />
                          <Input
                            label="Carrier"
                            value={editForm.carrier}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, carrier: value }))}
                            placeholder="e.g. Delhivery"
                          />
                          <Input
                            label="Tracking number"
                            value={editForm.trackingNumber}
                            onChange={(value) =>
                              setEditForm((prev) => ({ ...prev, trackingNumber: value }))
                            }
                            placeholder={editForm.status === "shipped" ? "Required for shipped" : "Optional"}
                          />
                        </FormGrid>
                      ) : (
                        <>
                          <div className="ed-brand-merch-item__badges">
                            <Badge>{order.status}</Badge>
                            <Badge tone={paymentBadgeTone(order.payment_status)}>
                              {order.payment_status}
                            </Badge>
                            {overdue ? <Badge tone="warning">Overdue</Badge> : null}
                          </div>

                          <div className="ed-brand-merch-item__facts">
                            <div className="ed-brand-merch-item__fact">
                              <span>Total</span>
                              <span>
                                {formatInrFromPaise(order.total_cents)}
                                {order.discount_cents > 0
                                  ? ` (−${formatInrFromPaise(order.discount_cents)})`
                                  : ""}
                              </span>
                            </div>
                            {inv ? (
                              <div className="ed-brand-merch-item__fact">
                                <span>Invoice</span>
                                <span>
                                  {inv.invoice_number} · due {new Date(inv.due_at).toLocaleDateString()} ·{" "}
                                  {inv.status}
                                </span>
                              </div>
                            ) : null}
                            {tracking.trackingNumber || tracking.carrier ? (
                              <div className="ed-brand-merch-item__fact">
                                <span>Shipping</span>
                                <span>
                                  {[tracking.carrier, tracking.trackingNumber].filter(Boolean).join(" · ")}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <ul className="ed-brand-merch-item__lines">
                            {order.merchandise_order_lines.map((line) => (
                              <li key={line.id}>{lineLabel(line)}</li>
                            ))}
                          </ul>

                          <div className="ed-brand-merch-item__actions">
                            {canApprove ? (
                              <Button
                                onClick={() =>
                                  statusUpdate.mutate({ orderId: order.id, status: "approved" })
                                }
                                disabled={statusUpdate.isPending}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {canShip && !showingShipForm ? (
                              <Button
                                onClick={() => startShip(order.id)}
                                disabled={statusUpdate.isPending}
                              >
                                Ship
                              </Button>
                            ) : null}
                            {canMarkPaid ? (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  markPaid.mutate({ orderId: order.id, amountCents: order.total_cents })
                                }
                                disabled={markPaid.isPending}
                              >
                                Mark invoice paid
                              </Button>
                            ) : null}
                            {canComplete ? (
                              <Button
                                variant="ghost"
                                onClick={() => complete.mutate(order.id)}
                                disabled={complete.isPending}
                              >
                                Complete
                              </Button>
                            ) : null}
                          </div>

                          {showingShipForm ? (
                            <div className="ed-brand-merch-item__ship">
                              <FormGrid>
                                <Input
                                  label="Carrier"
                                  value={carrier}
                                  onChange={setCarrier}
                                  placeholder="e.g. Delhivery"
                                />
                                <Input
                                  label="Tracking number"
                                  value={trackingNumber}
                                  onChange={setTrackingNumber}
                                  placeholder="Required"
                                />
                              </FormGrid>
                              <div className="ed-brand-merch-item__actions">
                                <Button
                                  onClick={() =>
                                    statusUpdate.mutate({
                                      orderId: order.id,
                                      status: "shipped",
                                      shippingTracking: {
                                        carrier: carrier.trim(),
                                        tracking_number: trackingNumber.trim(),
                                      },
                                    })
                                  }
                                  disabled={!trackingNumber.trim() || statusUpdate.isPending}
                                >
                                  Confirm shipped
                                </Button>
                                <Button variant="ghost" onClick={() => setShippingOrderId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
