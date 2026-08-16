import { Badge, Button, FormGrid, Input, Select } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import type { MerchandiseOrderRow } from "@/lib/merchandiseOrdersApi";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import {
  firstMerchandiseInvoice,
  isOverdueMerchandisePayment,
  merchandiseOrderCenterLabel,
  merchandiseOrderLineLabel,
  merchandiseOrderTracking,
  type OrderEditForm,
} from "./merchandisePageHelpers";

export const BRAND_EDITABLE_STATUSES = [
  { value: "placed", label: "placed" },
  { value: "approved", label: "approved" },
  { value: "shipped", label: "shipped" },
  { value: "cancelled", label: "cancelled" },
] as const;

function paymentBadgeTone(status: string): "success" | "warning" | "default" {
  if (status === "paid") return "success";
  if (status === "pending" || status === "awaiting") return "warning";
  return "default";
}

type Props = {
  order: MerchandiseOrderRow;
  editing: boolean;
  editForm: OrderEditForm;
  showingShipForm: boolean;
  carrier: string;
  trackingNumber: string;
  savePending: boolean;
  saveSaved: boolean;
  markPaidPending: boolean;
  completePending: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onCancelOrder?: () => void;
  onEditFormChange: (next: OrderEditForm) => void;
  onApprove: () => void;
  onStartShip: () => void;
  onConfirmShip: () => void;
  onCancelShip: () => void;
  onCarrierChange: (value: string) => void;
  onTrackingChange: (value: string) => void;
  onMarkPaid: () => void;
  onComplete: () => void;
};

export function BrandMerchandiseOrderCard({
  order,
  editing,
  editForm,
  showingShipForm,
  carrier,
  trackingNumber,
  savePending,
  saveSaved,
  markPaidPending,
  completePending,
  onEdit,
  onSave,
  onCancelEdit,
  onCancelOrder,
  onEditFormChange,
  onApprove,
  onStartShip,
  onConfirmShip,
  onCancelShip,
  onCarrierChange,
  onTrackingChange,
  onMarkPaid,
  onComplete,
}: Props) {
  const inv = firstMerchandiseInvoice(order);
  const overdue = isOverdueMerchandisePayment(order);
  const canApprove =
    order.payment_status === "paid" && (order.status === "placed" || order.status === "awaiting_payment");
  const canShip = order.status === "approved";
  const canComplete = order.status === "shipped" || order.status === "received";
  const canCancel = !["complete", "cancelled"].includes(order.status);
  const canMarkPaid = order.payment_status !== "paid" && (order.payment_method === "invoice" || inv != null);
  const tracking = merchandiseOrderTracking(order);

  return (
    <article className="ed-brand-merch-item">
      <div className="ed-brand-merch-item__inner">
        <div className="ed-brand-merch-item__head">
          <div>
            <h3 className="ed-brand-merch-item__title">{merchandiseOrderCenterLabel(order)}</h3>
            <p className="ed-brand-merch-item__meta">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div className="ed-brand-merch-item__actions">
            <CrudRowActions
              editing={editing}
              onEdit={onEdit}
              onSave={onSave}
              onCancel={onCancelEdit}
              onDelete={canCancel ? onCancelOrder : undefined}
              deleteTitle="Cancel order"
              deleteDescription="This cancels the merchandise order. It cannot be undone from this screen."
              saveDisabled={savePending}
              savePending={savePending}
              saveSaved={saveSaved}
              saveLabel="Save order"
            />
          </div>
        </div>

        {editing ? (
          <FormGrid>
            <Select
              label="Status"
              value={editForm.status}
              onChange={(status) => onEditFormChange({ ...editForm, status })}
              options={BRAND_EDITABLE_STATUSES.map((status) => ({
                value: status.value,
                label: status.label,
              }))}
            />
            <Input
              label="Carrier"
              value={editForm.carrier}
              onChange={(value) => onEditFormChange({ ...editForm, carrier: value })}
              placeholder="e.g. Delhivery"
            />
            <Input
              label="Tracking number"
              value={editForm.trackingNumber}
              onChange={(value) => onEditFormChange({ ...editForm, trackingNumber: value })}
              placeholder={editForm.status === "shipped" ? "Required for shipped" : "Optional"}
            />
          </FormGrid>
        ) : (
          <>
            <div className="ed-brand-merch-item__badges">
              <Badge>{order.status}</Badge>
              <Badge tone={paymentBadgeTone(order.payment_status)}>{order.payment_status}</Badge>
              {overdue ? <Badge tone="warning">Overdue</Badge> : null}
            </div>

            <div className="ed-brand-merch-item__facts">
              <div className="ed-brand-merch-item__fact">
                <span>Total</span>
                <span>
                  {formatInrFromPaise(order.total_cents)}
                  {order.discount_cents > 0 ? ` (−${formatInrFromPaise(order.discount_cents)})` : ""}
                </span>
              </div>
              {inv ? (
                <div className="ed-brand-merch-item__fact">
                  <span>Invoice</span>
                  <span>
                    {inv.invoice_number} · due {new Date(inv.due_at).toLocaleDateString()} · {inv.status}
                  </span>
                </div>
              ) : null}
              {tracking.trackingNumber || tracking.carrier ? (
                <div className="ed-brand-merch-item__fact">
                  <span>Shipping</span>
                  <span>{[tracking.carrier, tracking.trackingNumber].filter(Boolean).join(" · ")}</span>
                </div>
              ) : null}
            </div>

            <ul className="ed-brand-merch-item__lines">
              {order.merchandise_order_lines.map((line) => (
                <li key={line.id}>{merchandiseOrderLineLabel(line)} ({formatInrFromPaise(line.unit_price_cents)} each)</li>
              ))}
            </ul>

            <div className="ed-brand-merch-item__actions">
              {canApprove ? (
                <Button onClick={onApprove} disabled={savePending}>
                  Approve
                </Button>
              ) : null}
              {canShip && !showingShipForm ? (
                <Button onClick={onStartShip} disabled={savePending}>
                  Ship
                </Button>
              ) : null}
              {canMarkPaid ? (
                <Button variant="ghost" onClick={onMarkPaid} disabled={markPaidPending}>
                  Mark invoice paid
                </Button>
              ) : null}
              {canComplete ? (
                <Button variant="ghost" onClick={onComplete} disabled={completePending}>
                  Complete
                </Button>
              ) : null}
            </div>

            {showingShipForm ? (
              <div className="ed-brand-merch-item__ship">
                <FormGrid>
                  <Input label="Carrier" value={carrier} onChange={onCarrierChange} placeholder="e.g. Delhivery" />
                  <Input
                    label="Tracking number"
                    value={trackingNumber}
                    onChange={onTrackingChange}
                    placeholder="Required"
                  />
                </FormGrid>
                <div className="ed-brand-merch-item__actions">
                  <Button onClick={onConfirmShip} disabled={!trackingNumber.trim() || savePending}>
                    Confirm shipped
                  </Button>
                  <Button variant="ghost" onClick={onCancelShip}>
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
}
