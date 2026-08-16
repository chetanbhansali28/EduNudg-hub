import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, PipelineWorkspace, ToggleField } from "@edunudg/ui";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import {
  completeMerchandiseOrder,
  listBrandMerchandiseOrders,
  recordMerchandisePayment,
  type MerchandiseOrderRow,
  updateMerchandiseOrderStatus,
} from "@/lib/merchandiseOrdersApi";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
import { BrandMerchandiseOrderCard, BRAND_EDITABLE_STATUSES } from "./BrandMerchandiseOrderCard";
import { MerchandisePipelineListItem } from "./MerchandisePipelineListItem";
import {
  filterMerchandiseOrders,
  merchandiseOrderCenterLabel,
  merchandiseOrderListBadge,
  orderToEditForm,
  type OrderEditForm,
} from "./merchandisePageHelpers";
import "./brandMerchandiseCatalog.css";

type Props = {
  brandId: string;
  search?: string;
};

export function BrandMerchandiseOrdersSection({ brandId, search = "" }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const orderSaved = useSavedFlash();
  const { isDesktop } = useOpsBreakpoint();
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["brand-merchandise-orders", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandMerchandiseOrders(brandId),
  });

  const allOrders = orders.data ?? [];
  const filteredOrders = useMemo(
    () => filterMerchandiseOrders(allOrders, search, overdueOnly),
    [allOrders, search, overdueOnly],
  );

  useEffect(() => {
    if (selectedId && filteredOrders.some((item) => item.id === selectedId)) return;
    setSelectedId(filteredOrders[0]?.id ?? null);
    setEditingId(null);
    setShippingOrderId(null);
  }, [filteredOrders, selectedId]);

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
      orderSaved.flash();
      setShippingOrderId(null);
      setCarrier("");
      setTrackingNumber("");
      window.setTimeout(() => setEditingId(null), 1500);
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
    if (!BRAND_EDITABLE_STATUSES.some((status) => status.value === nextStatus)) {
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

  const selectedOrder = filteredOrders.find((item) => item.id === selectedId) ?? null;

  const renderCard = (order: MerchandiseOrderRow) => (
    <BrandMerchandiseOrderCard
      key={order.id}
      order={order}
      editing={editingId === order.id}
      editForm={editForm}
      showingShipForm={shippingOrderId === order.id}
      carrier={carrier}
      trackingNumber={trackingNumber}
      savePending={statusUpdate.isPending}
      saveSaved={orderSaved.saved && editingId === order.id}
      markPaidPending={markPaid.isPending}
      completePending={complete.isPending}
      onEdit={() => {
        setShippingOrderId(null);
        setEditingId(order.id);
        setEditForm(orderToEditForm(order));
      }}
      onSave={() => saveEdit(order)}
      onCancelEdit={() => setEditingId(null)}
      onCancelOrder={
        !["complete", "cancelled"].includes(order.status)
          ? () => statusUpdate.mutate({ orderId: order.id, status: "cancelled" })
          : undefined
      }
      onEditFormChange={setEditForm}
      onApprove={() => statusUpdate.mutate({ orderId: order.id, status: "approved" })}
      onStartShip={() => startShip(order.id)}
      onConfirmShip={() =>
        statusUpdate.mutate({
          orderId: order.id,
          status: "shipped",
          shippingTracking: {
            carrier: carrier.trim(),
            tracking_number: trackingNumber.trim(),
          },
        })
      }
      onCancelShip={() => setShippingOrderId(null)}
      onCarrierChange={setCarrier}
      onTrackingChange={setTrackingNumber}
      onMarkPaid={() => markPaid.mutate({ orderId: order.id, amountCents: order.total_cents })}
      onComplete={() => complete.mutate(order.id)}
    />
  );

  const overdueFilter = (
    <div className="ed-brand-merch-list-filter">
      <ToggleField
        label="Overdue payments only"
        description="Show invoice orders past due date with unpaid balance"
        checked={overdueOnly}
        onChange={setOverdueOnly}
      />
    </div>
  );

  const emptyCopy = overdueOnly ? "No overdue payment orders." : allOrders.length === 0 ? "No merchandise orders yet." : "No merchandise orders match this view.";
  const listEmpty = !orders.isLoading && filteredOrders.length === 0 ? (
    <p className="ed-brand-merch-catalog__empty">{emptyCopy}</p>
  ) : null;

  const listPanel = (
    <>
      {overdueFilter}
      {orders.isLoading ? (
        <p className="ed-text-sm ed-muted">Loading orders…</p>
      ) : filteredOrders.length === 0 ? (
        listEmpty
      ) : (
        <div className="ed-franchise-apps-page__desktop-list">
          {filteredOrders.map((order) => {
            const badge = merchandiseOrderListBadge(order);
            return (
              <MerchandisePipelineListItem
                key={order.id}
                selected={order.id === selectedId}
                badge={badge.label}
                badgeTone={badge.tone}
                when={formatInrFromPaise(order.total_cents)}
                title={merchandiseOrderCenterLabel(order)}
                location={new Date(order.created_at).toLocaleDateString()}
                onClick={() => {
                  setSelectedId(order.id);
                  setEditingId(null);
                  setShippingOrderId(null);
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );

  const detailPanel = selectedOrder ? (
    <div className="ed-brand-merch-catalog">{renderCard(selectedOrder)}</div>
  ) : (
    <div className="ed-franchise-apps-page__placeholder">
      <p className="ed-text-sm ed-muted">Select a franchise order to review payment and fulfillment.</p>
    </div>
  );

  return (
    <>
      <MutationError message={error} />

      {isDesktop ? (
        <PipelineWorkspace detailOpen={!!selectedOrder} list={listPanel} detail={detailPanel} />
      ) : (
        <div className="ed-brand-merch-catalog">
          {overdueFilter}
          {orders.isLoading ? <p className="ed-text-sm ed-muted">Loading orders…</p> : null}
          {listEmpty}
          {filteredOrders.map((order) => renderCard(order))}
        </div>
      )}
    </>
  );
}
