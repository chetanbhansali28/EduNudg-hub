import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, PipelineDetailPanel } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  fetchCatalogItemIncomingLines,
  fetchCatalogItemOrderHistory,
  formatEstimatedDeliveryLabel,
  formatPurchaseOrderLabel,
  inventoryStockBadge,
  type InventorySummaryRow,
} from "@/lib/centerInventoryApi";
import { LOW_STOCK_THRESHOLD } from "@/lib/centerDashboardStats";
import { IconCalendar, IconHistory, IconPlus, IconTruck } from "./InventoryIcons";

type Props = {
  centerId: string;
  item: InventorySummaryRow;
  valueTotalCents: number;
  valueTrendPercent: number | null;
  valueLoading?: boolean;
};

export function InventoryItemDetailPanel({
  centerId,
  item,
  valueTotalCents,
  valueTrendPercent,
  valueLoading,
}: Props) {
  const navigate = useNavigate();
  const stock = inventoryStockBadge(item, LOW_STOCK_THRESHOLD);
  const history = useQuery({
    queryKey: ["center-inventory-history", centerId, item.catalogItemId],
    enabled: !!centerId,
    queryFn: () => fetchCatalogItemOrderHistory(centerId, item.catalogItemId, 6),
  });

  const incoming = useQuery({
    queryKey: ["center-inventory-incoming", centerId, item.catalogItemId],
    enabled: !!centerId,
    queryFn: () => fetchCatalogItemIncomingLines(centerId, item.catalogItemId),
  });

  const incomingUnits = incoming.data?.reduce((sum, row) => sum + row.quantity, 0) ?? 0;
  const nextDelivery = incoming.data
    ?.map((row) => formatEstimatedDeliveryLabel(row.estimatedDelivery))
    .find(Boolean);

  const historyRows = history.data ?? [];

  return (
    <PipelineDetailPanel
      title={item.name}
      menu={<Badge tone={stock.tone}>{stock.label}</Badge>}
      footer={
        <Button variant="primary" block onClick={() => navigate("/app/merchandise")}>
          <IconPlus />
          Place New Order
        </Button>
      }
    >
      <div className="ed-inv-detail">
        <div className="ed-inv-detail__top">
          <div className="ed-inv-detail__hero">
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.name} className="ed-inv-detail__photo" />
            ) : (
              <div className="ed-inv-detail__photo ed-inv-detail__photo--empty" aria-hidden />
            )}
          </div>
          <div className="ed-inv-detail__stats">
            <p className="ed-inv-detail__sku">SKU {item.sku}</p>
            <div className="ed-pipeline-detail-facts">
              <div>
                <p className="ed-pipeline-detail-facts__label">Available</p>
                <p className="ed-pipeline-detail-facts__value ed-pipeline-detail-facts__value--primary">{item.available}</p>
              </div>
              <div>
                <p className="ed-pipeline-detail-facts__label">On hand</p>
                <p className="ed-pipeline-detail-facts__value">{item.onHand}</p>
              </div>
              <div>
                <p className="ed-pipeline-detail-facts__label">Incoming</p>
                <p className="ed-pipeline-detail-facts__value">{item.incoming}</p>
              </div>
              <div>
                <p className="ed-pipeline-detail-facts__label">Allocated</p>
                <p className="ed-pipeline-detail-facts__value">{item.allocated}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ed-inv-detail__split">
          <section>
            <h3 className="ed-pipeline-timeline__section-title">
              <IconTruck className="ed-inv-detail__section-icon" />
              On the way
            </h3>
            {incomingUnits > 0 ? (
              <div className="ed-inv-detail__incoming-card">
                <div>
                  <strong className="ed-inv-detail__incoming-qty">{incomingUnits} Units</strong>
                  {nextDelivery ? (
                    <p className="ed-inv-detail__incoming-date">Estimated delivery: {nextDelivery}</p>
                  ) : (
                    <p className="ed-inv-detail__incoming-date">Awaiting shipment update</p>
                  )}
                </div>
                <IconCalendar className="ed-inv-detail__incoming-calendar" />
              </div>
            ) : (
              <p className="ed-inv-detail__empty-note">No pending shipments for this item.</p>
            )}
          </section>

          <section>
            <h3 className="ed-pipeline-timeline__section-title">
              <IconHistory className="ed-inv-detail__section-icon" />
              Orders (last 6 months)
            </h3>
            {historyRows.length > 0 ? (
              <ul className="ed-inv-detail__orders">
                {historyRows.map((row) => (
                  <li key={`${row.orderId}-${row.orderDate}`} className="ed-inv-detail__order-row">
                    <div>
                      <strong>{formatPurchaseOrderLabel(row.orderId)}</strong>
                      <p>
                        {new Date(row.orderDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="ed-inv-detail__order-qty">{row.quantity} Units</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ed-inv-detail__empty-note">No orders in the last 6 months.</p>
            )}
            {historyRows.length > 0 ? (
              <p className="ed-inv-detail__orders-footer">No more orders in this period.</p>
            ) : null}
          </section>
        </div>

        <InventoryValueCard
          totalCents={valueTotalCents}
          trendPercent={valueTrendPercent}
          loading={valueLoading}
        />
      </div>
    </PipelineDetailPanel>
  );
}

type ValueCardProps = {
  totalCents: number;
  trendPercent: number | null;
  loading?: boolean;
};

export function InventoryValueCard({ totalCents, trendPercent, loading }: ValueCardProps) {
  return (
    <section className="ed-inv-value-card" aria-label="Inventory value summary">
      <h3 className="ed-pipeline-timeline__section-title">Inventory Value</h3>
      <p className="ed-inv-value-card__amount">{loading ? "—" : formatInrFromPaise(totalCents)}</p>
      <p className="ed-inv-value-card__desc">Total asset value of current on-hand kits across all levels.</p>
      {trendPercent != null ? (
        <p className="ed-inv-value-card__trend">
          <span className="ed-inv-value-card__trend-icon" aria-hidden>
            ↗
          </span>
          {trendPercent >= 0 ? "+" : ""}
          {trendPercent}% vs last month
        </p>
      ) : null}
    </section>
  );
}
