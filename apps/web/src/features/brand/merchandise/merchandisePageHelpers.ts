export type CatalogTabFilter = "all" | "active" | "draft";

export type MerchandiseCatalogCountRow = {
  sku: string;
  name: string;
  is_active: boolean;
};

export function merchandiseCatalogCounts(items: MerchandiseCatalogCountRow[]) {
  const active = items.filter((item) => item.is_active).length;
  const draft = items.filter((item) => !item.is_active).length;
  return { active, draft, total: items.length };
}

export function merchandisePageCounts(items: MerchandiseCatalogCountRow[], orderCount: number) {
  return { ...merchandiseCatalogCounts(items), orders: orderCount };
}

export function matchesMerchandiseSearch(item: MerchandiseCatalogCountRow, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [item.name, item.sku].join(" ").toLowerCase().includes(query);
}

export function filterMerchandiseCatalog<T extends MerchandiseCatalogCountRow>(
  items: T[],
  filter: CatalogTabFilter,
  search = "",
): T[] {
  return items.filter((item) => {
    if (filter === "active" && !item.is_active) return false;
    if (filter === "draft" && item.is_active) return false;
    return matchesMerchandiseSearch(item, search);
  });
}
