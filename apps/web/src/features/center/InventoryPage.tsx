import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  DataList,
  FilterTabs,
  LeadKpiCard,
  LeadKpiGrid,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelinePageHeader,
  PipelineWorkspace,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { InventoryItemDetailPanel } from "@/features/center/inventory/InventoryItemDetailPanel";
import { IconDownload } from "@/features/center/inventory/InventoryIcons";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import {
  downloadInventoryCsv,
  fetchCenterInventorySummary,
  fetchInventoryValueStats,
  filterCenterInventory,
  inventoryPageCounts,
  inventoryStockBadge,
  type InventoryTabFilter,
} from "@/lib/centerInventoryApi";
import { LOW_STOCK_THRESHOLD } from "@/lib/centerDashboardStats";
import { initialsFromName } from "@/lib/welcomeMessage";
import "@/features/brand/franchiseApplications/franchiseApplications.css";
import "@/features/center/centerOps.css";
import "@/features/center/inventory/inventory.css";

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export function InventoryPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const centerId = tenant.centerId;
  const { isDesktop, isMobile } = useOpsBreakpoint();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<InventoryTabFilter>("all");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const inventory = useQuery({
    queryKey: ["center-inventory-summary", brandId, centerId],
    enabled: !!brandId && !!centerId,
    queryFn: () => fetchCenterInventorySummary(brandId!, centerId!),
  });

  const valueStats = useQuery({
    queryKey: ["center-inventory-value", brandId, centerId],
    enabled: !!brandId && !!centerId,
    queryFn: () => fetchInventoryValueStats(brandId!, centerId!),
  });

  const allItems = inventory.data ?? [];
  const pageCounts = useMemo(() => inventoryPageCounts(allItems, LOW_STOCK_THRESHOLD), [allItems]);
  const filtered = useMemo(
    () => filterCenterInventory(allItems, listFilter, search, LOW_STOCK_THRESHOLD),
    [allItems, listFilter, search]
  );

  useEffect(() => {
    if (selectedId || filtered.length === 0) return;
    setSelectedId(filtered[0]!.catalogItemId);
  }, [selectedId, filtered]);

  const selected =
    filtered.find((item) => item.catalogItemId === selectedId) ??
    allItems.find((item) => item.catalogItemId === selectedId) ??
    null;

  const selectItem = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(true);
  };

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  const filterTabs = [
    { value: "all" as const, label: isMobile ? "All" : "All items", count: pageCounts.total },
    { value: "in_stock" as const, label: "In stock", count: pageCounts.inStock },
    { value: "low" as const, label: "Low stock", count: pageCounts.lowStock },
  ];

  const listPanel = (
    <div className="ed-pipeline-list-panel">
      {inventory.isLoading ? <p className="ed-text-sm ed-muted">Loading inventory…</p> : null}
      <DataList
        variant="pipeline"
        items={filtered.map((item) => ({ ...item, id: item.catalogItemId }))}
        empty={
          <PipelineEmptyState
            message={
              search.trim()
                ? "No items match your search."
                : "No merchandise inventory yet. Place an order from the shop to start tracking stock."
            }
            actionLabel={search.trim() ? undefined : "Browse merchandise"}
            onAction={
              search.trim()
                ? undefined
                : () => {
                    window.location.href = "/app/merchandise";
                  }
            }
          />
        }
        render={(item) => {
          const badge = inventoryStockBadge(item, LOW_STOCK_THRESHOLD);
          return (
            <PipelineListItem
              title={item.name}
              meta={`SKU ${item.sku}`}
              lines={[
                `Available ${item.available} · On hand ${item.onHand}`,
                item.incoming > 0 ? `${item.incoming} incoming` : "No incoming units",
              ]}
              initials={initialsFromName(item.name)}
              badges={<Badge tone={badge.tone}>{badge.label}</Badge>}
              selected={item.catalogItemId === selectedId}
              onSelect={() => selectItem(item.catalogItemId)}
            />
          );
        }}
      />
    </div>
  );

  const detailPanel = selected ? (
    <div className="ed-center-inventory-detail">
      <InventoryItemDetailPanel
        centerId={centerId}
        item={selected}
        valueTotalCents={valueStats.data?.totalCents ?? 0}
        valueTrendPercent={valueStats.data?.trendPercent ?? null}
        valueLoading={valueStats.isLoading}
      />
    </div>
  ) : (
    <div className="ed-pipeline-list-panel">
      <PipelineDetailPlaceholder message="Select an item to view order history and incoming shipments." />
    </div>
  );

  return (
    <div className={`ed-franchise-apps-page ed-center-inventory-page${isMobile ? " ed-franchise-apps-page--detail-open" : ""}`}>
      <PipelinePageHeader
        title="Inventory"
        subtitle="Manage on-hand stock and track incoming merchandise."
        actions={
          <Button
            variant="secondary"
            disabled={!allItems.length}
            onClick={() => downloadInventoryCsv(allItems)}
          >
            <IconDownload />
            Export CSV
          </Button>
        }
      />

      <LeadKpiGrid>
        <LeadKpiCard
          label="In stock"
          value={pageCounts.inStock}
          hint="Healthy levels"
          active={listFilter === "in_stock"}
          onClick={() => setListFilter("in_stock")}
        />
        <LeadKpiCard
          label="Low stock"
          value={pageCounts.lowStock}
          hint={`≤ ${LOW_STOCK_THRESHOLD} available`}
          tone="lost"
          active={listFilter === "low"}
          onClick={() => setListFilter("low")}
        />
        <LeadKpiCard
          label="Incoming"
          value={pageCounts.incoming}
          hint="Inbound SKUs"
        />
        <LeadKpiCard
          label={isMobile ? "All items" : "Total"}
          value={pageCounts.total}
          hint="Tracked SKUs"
          tone="total"
          active={listFilter === "all"}
          onClick={() => setListFilter("all")}
        />
      </LeadKpiGrid>

      <div className="ed-franchise-apps-page__toolbar">
        <label className="ed-franchise-apps-page__search">
          <span className="ed-franchise-apps-page__search-icon">{ICON_SEARCH}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or SKU…"
            aria-label="Search inventory"
          />
        </label>
        <FilterTabs
          options={filterTabs}
          value={listFilter}
          onChange={setListFilter}
          aria-label="Inventory filter"
        />
      </div>

      {isMobile ? listPanel : <PipelineWorkspace detailOpen={!!selected} list={listPanel} detail={detailPanel} />}

      {isMobile ? (
        <>
          <Link to="/app/merchandise" className="ed-franchise-apps-page__fab" aria-label="Place new order">
            +
          </Link>
          {mobileDetailOpen && selected ? (
            <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Inventory item">
              <div className="ed-ops-mobile-detail__bar">
                <button type="button" className="ed-ops-mobile-detail__back" onClick={() => setMobileDetailOpen(false)}>
                  ← Back
                </button>
              </div>
              {detailPanel}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
