import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageGridFull,
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
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string };

type InvoiceSnapshot = {
  id: string;
  invoice_number: string;
  status: string;
  due_at: string;
};

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

export function BrandMerchandiseOrdersSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

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
    setShippingOrderId(orderId);
    setCarrier("");
    setTrackingNumber("");
  };

  return (
    <>
      <MutationError message={error} />

      <PageGridFull>
        <Card title="Center merchandise orders">
          <ToggleField
            label="Overdue payments only"
            description="Show invoice orders past due date with unpaid balance"
            checked={overdueOnly}
            onChange={setOverdueOnly}
          />

          <DataList
            items={filteredOrders}
            empty={overdueOnly ? "No overdue payment orders." : "No merchandise orders yet."}
            render={(order) => {
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

              return (
                <ListRow>
                  <div>
                    <strong>{centerLabel(order)}</strong>
                    <div className="ed-text-sm ed-muted">{new Date(order.created_at).toLocaleString()}</div>
                    <div className="ed-text-sm" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Badge>{order.status}</Badge>
                      <Badge tone={paymentBadgeTone(order.payment_status)}>{order.payment_status}</Badge>
                      {overdue && <Badge tone="warning">Overdue</Badge>}
                    </div>
                    <div className="ed-text-sm ed-muted">
                      Total: {formatInrFromPaise(order.total_cents)}
                      {order.discount_cents > 0 && ` (discount ${formatInrFromPaise(order.discount_cents)})`}
                    </div>
                    {inv && (
                      <div className="ed-text-sm ed-muted">
                        Invoice {inv.invoice_number} · due {new Date(inv.due_at).toLocaleDateString()} · {inv.status}
                      </div>
                    )}
                    <ul className="ed-text-sm">
                      {order.merchandise_order_lines.map((line) => (
                        <li key={line.id}>{lineLabel(line)}</li>
                      ))}
                    </ul>

                    <div className="ed-btn-stack" style={{ marginTop: "0.75rem" }}>
                      {canApprove && (
                        <Button
                          onClick={() => statusUpdate.mutate({ orderId: order.id, status: "approved" })}
                          disabled={statusUpdate.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {canShip && !showingShipForm && (
                        <Button onClick={() => startShip(order.id)} disabled={statusUpdate.isPending}>
                          Ship
                        </Button>
                      )}
                      {canMarkPaid && (
                        <Button
                          variant="ghost"
                          onClick={() => markPaid.mutate({ orderId: order.id, amountCents: order.total_cents })}
                          disabled={markPaid.isPending}
                        >
                          Mark invoice paid
                        </Button>
                      )}
                      {canComplete && (
                        <Button
                          variant="ghost"
                          onClick={() => complete.mutate(order.id)}
                          disabled={complete.isPending}
                        >
                          Complete
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="danger"
                          onClick={() => statusUpdate.mutate({ orderId: order.id, status: "cancelled" })}
                          disabled={statusUpdate.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {showingShipForm && (
                      <div className="ed-form-section" style={{ marginTop: "0.75rem" }}>
                        <FormGrid>
                          <Input label="Carrier" value={carrier} onChange={setCarrier} placeholder="e.g. Delhivery" />
                          <Input
                            label="Tracking number"
                            value={trackingNumber}
                            onChange={setTrackingNumber}
                            placeholder="Required"
                          />
                        </FormGrid>
                        <div className="ed-btn-stack">
                          <Button
                            onClick={() =>
                              statusUpdate.mutate({
                                orderId: order.id,
                                status: "shipped",
                                shippingTracking: { carrier: carrier.trim(), tracking_number: trackingNumber.trim() },
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
                    )}
                  </div>
                </ListRow>
              );
            }}
          />
        </Card>
      </PageGridFull>
    </>
  );
}
