import { LOW_STOCK_THRESHOLD } from "@/lib/centerDashboardStats";
import type { InventorySummaryRow } from "@/lib/centerInventoryApi";

type Props = {
  item: InventorySummaryRow;
  selected: boolean;
  onSelect: () => void;
};

function stockBadge(item: InventorySummaryRow) {
  if (item.available <= LOW_STOCK_THRESHOLD) {
    return { label: "LOW STOCK", tone: "low" as const };
  }
  return { label: "IN STOCK", tone: "ok" as const };
}

export function InventoryStockCard({ item, selected, onSelect }: Props) {
  const badge = stockBadge(item);

  return (
    <button
      type="button"
      className={`ed-inv-stock-card${selected ? " ed-inv-stock-card--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="ed-inv-stock-card__head">
        <div className="ed-inv-stock-card__identity">
          <h3 className="ed-inv-stock-card__title">{item.name}</h3>
          <p className="ed-inv-stock-card__sku">SKU {item.sku}</p>
        </div>
        <span className={`ed-inv-stock-card__badge ed-inv-stock-card__badge--${badge.tone}`}>
          <span className="ed-inv-stock-card__badge-dot" aria-hidden />
          {badge.label}
        </span>
      </div>

      <div className="ed-inv-stock-card__metrics">
        <div className="ed-inv-stock-card__metric">
          <span className="ed-inv-stock-card__metric-label">Available</span>
          <strong className="ed-inv-stock-card__metric-value">{item.available}</strong>
        </div>
        <div className="ed-inv-stock-card__metric">
          <span className="ed-inv-stock-card__metric-label">On hand</span>
          <strong className="ed-inv-stock-card__metric-value">{item.onHand}</strong>
        </div>
        <div className="ed-inv-stock-card__metric">
          <span className="ed-inv-stock-card__metric-label">Allocated</span>
          <strong className="ed-inv-stock-card__metric-value">{item.allocated}</strong>
        </div>
        <div className="ed-inv-stock-card__metric">
          <span className="ed-inv-stock-card__metric-label">Incoming</span>
          <strong className="ed-inv-stock-card__metric-value">{item.incoming}</strong>
        </div>
      </div>
    </button>
  );
}
