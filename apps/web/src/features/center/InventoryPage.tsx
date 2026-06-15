import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { InventoryItemDetailPanel, InventoryValueCard } from "@/features/center/inventory/InventoryItemDetailPanel";
import { IconDownload, IconSearch } from "@/features/center/inventory/InventoryIcons";
import { InventoryStockCard } from "@/features/center/inventory/InventoryStockCard";
import {
  downloadInventoryCsv,
  fetchCenterInventorySummary,
  fetchInventoryValueStats,
  type InventorySummaryRow,
} from "@/lib/centerInventoryApi";
import "@/features/center/inventory/inventory.css";

function matchesSearch(item: InventorySummaryRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.name, item.sku].some((value) => value.toLowerCase().includes(q));
}

function centerBreadcrumbLabel(
  branding: { brandName: string | null; centerName: string | null } | undefined,
  brandSlug?: string | null,
  centerSlug?: string | null
): string {
  const brand = branding?.brandName ?? brandSlug ?? "Brand";
  const center = branding?.centerName ?? centerSlug ?? "Center";
  return `${brand} ${center}`;
}

export function InventoryPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const centerId = tenant.centerId;
  const { data: branding } = usePortalBranding();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(
    () => (inventory.data ?? []).filter((item) => matchesSearch(item, search)),
    [inventory.data, search]
  );

  useEffect(() => {
    if (selectedId || filtered.length === 0) return;
    setSelectedId(filtered[0]!.catalogItemId);
  }, [selectedId, filtered]);

  const selected =
    filtered.find((item) => item.catalogItemId === selectedId) ??
    (inventory.data ?? []).find((item) => item.catalogItemId === selectedId) ??
    null;

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  const breadcrumbCenter = centerBreadcrumbLabel(branding ?? undefined, tenant.brandSlug, tenant.centerSlug);

  return (
    <div className="ed-inv-page">
      <p className="ed-inv-page__crumbs">Center / {breadcrumbCenter}</p>

      <div className="ed-inv-page__header">
        <div>
          <h1 className="ed-inv-page__title">Inventory</h1>
          <p className="ed-inv-page__subtitle">Manage on-hand stock and track incoming merchandise.</p>
        </div>
        <button
          type="button"
          className="ed-inv-page__export"
          disabled={!inventory.data?.length}
          onClick={() => downloadInventoryCsv(inventory.data ?? [])}
        >
          <IconDownload />
          Export CSV
        </button>
      </div>

      <div className="ed-inv-page__search-wrap">
        <IconSearch className="ed-inv-page__search-icon" />
        <input
          type="search"
          className="ed-inv-page__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU (e.g., KIT001)"
          aria-label="Search inventory"
        />
      </div>

      <div className="ed-inv-page__body">
        <section className="ed-inv-page__main" aria-label="Stock by item">
          <div className="ed-inv-page__list-header">
            <h2 className="ed-inv-page__list-title">Stock by item</h2>
            <span className="ed-inv-page__list-badge">{filtered.length} ITEMS SHOWN</span>
          </div>

          {inventory.isLoading ? (
            <p className="ed-text-sm ed-muted">Loading inventory…</p>
          ) : filtered.length === 0 ? (
            <div className="ed-inv-page__empty">
              <p>
                {search.trim()
                  ? "No items match your search."
                  : "No merchandise inventory yet. Place an order from the shop to start tracking stock."}
              </p>
              {!search.trim() ? (
                <Link to="/app/merchandise" className="ed-inv-page__empty-link">
                  Browse merchandise
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="ed-inv-page__cards">
              {filtered.map((item) => (
                <InventoryStockCard
                  key={item.catalogItemId}
                  item={item}
                  selected={selectedId === item.catalogItemId}
                  onSelect={() => setSelectedId(item.catalogItemId)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="ed-inv-page__aside">
          {selected ? (
            <InventoryItemDetailPanel centerId={centerId} item={selected} />
          ) : (
            <div className="ed-inv-detail__placeholder">
              Select an item to view order history and incoming shipments.
            </div>
          )}
          <InventoryValueCard
            totalCents={valueStats.data?.totalCents ?? 0}
            trendPercent={valueStats.data?.trendPercent ?? null}
            loading={valueStats.isLoading}
          />
        </aside>
      </div>
    </div>
  );
}
