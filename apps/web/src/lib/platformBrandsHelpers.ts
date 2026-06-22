export type PlatformBrandStatus = "draft" | "active" | "suspended" | "archived";

export type PlatformBrandRow = {
  id: string;
  slug: string;
  name: string;
  status: PlatformBrandStatus;
  logo_url: string | null;
};

export type PlatformBrandsHome = {
  brands: PlatformBrandRow[];
  pendingSignups: number;
  totalStudents: number;
  monthlyGrowthPercent: number | null;
};

export function brandStatusTone(status: PlatformBrandStatus): "active" | "draft" | "warning" | "neutral" {
  if (status === "active") return "active";
  if (status === "draft") return "draft";
  if (status === "suspended") return "warning";
  return "neutral";
}

export function brandStatusLabel(status: PlatformBrandStatus): string {
  if (status === "active") return "ACTIVE";
  if (status === "draft") return "DRAFT";
  if (status === "suspended") return "SUSPENDED";
  return status.toUpperCase();
}

export function brandSubtitle(name: string, slug: string): string {
  const trimmed = name.trim();
  if (!trimmed) return `slug: ${slug}`;
  return `${trimmed} franchise network`;
}

export function formatStudentCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(count);
}

export function formatGrowthPercent(value: number | null): string {
  if (value == null) return "—";
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function sortBrandsAlphabetical(brands: PlatformBrandRow[]): PlatformBrandRow[] {
  return sortBrands(brands, "name-asc");
}

export type BrandSortKey = "name-asc" | "name-desc" | "slug-asc" | "slug-desc";

export const BRANDS_LIST_CONTROLS_THRESHOLD = 10;
export const BRANDS_PAGE_SIZE = 10;

export const BRAND_SORT_OPTIONS: { value: BrandSortKey; label: string }[] = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "slug-asc", label: "Slug (A–Z)" },
  { value: "slug-desc", label: "Slug (Z–A)" },
];

export function shouldShowBrandsListControls(totalBrands: number): boolean {
  return totalBrands > BRANDS_LIST_CONTROLS_THRESHOLD;
}

export function sortBrands(brands: PlatformBrandRow[], sort: BrandSortKey): PlatformBrandRow[] {
  const copy = [...brands];
  switch (sort) {
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "slug-asc":
      return copy.sort((a, b) => a.slug.localeCompare(b.slug));
    case "slug-desc":
      return copy.sort((a, b) => b.slug.localeCompare(a.slug));
  }
}

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    page: safePage,
    pageCount,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}

export function brandsPaginationSummary(result: PaginatedResult<unknown>): string {
  if (result.total === 0) return "No brands";
  return `${result.rangeStart}–${result.rangeEnd} of ${result.total}`;
}

export function resolveBrandsList(
  brands: PlatformBrandRow[],
  options: {
    showControls: boolean;
    search: string;
    sort: BrandSortKey;
    page: number;
  }
): PaginatedResult<PlatformBrandRow> {
  const sorted = sortBrands(brands, options.showControls ? options.sort : "name-asc");
  if (!options.showControls) {
    return {
      items: sorted,
      page: 1,
      pageCount: 1,
      total: sorted.length,
      rangeStart: sorted.length === 0 ? 0 : 1,
      rangeEnd: sorted.length,
    };
  }

  const filtered = filterBrands(sorted, options.search);
  return paginateItems(filtered, options.page, BRANDS_PAGE_SIZE);
}

export function filterBrands(brands: PlatformBrandRow[], query: string): PlatformBrandRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return brands;
  return brands.filter(
    (brand) => brand.name.toLowerCase().includes(needle) || brand.slug.toLowerCase().includes(needle)
  );
}

export function pendingReviewLabel(count: number): string {
  return String(count).padStart(2, "0");
}
