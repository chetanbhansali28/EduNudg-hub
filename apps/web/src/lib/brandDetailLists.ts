import { paginateItems, type PaginatedResult } from "@/lib/platformBrandsHelpers";

export const BRAND_DETAIL_LIST_PAGE_SIZE = 10;

export function shouldPaginateBrandDetailList(total: number): boolean {
  return total > BRAND_DETAIL_LIST_PAGE_SIZE;
}

export function paginateBrandDetailList<T>(items: T[], page: number): PaginatedResult<T> {
  return paginateItems(items, page, BRAND_DETAIL_LIST_PAGE_SIZE);
}

export function brandDetailPaginationSummary(result: PaginatedResult<unknown>, emptyLabel: string): string {
  if (result.total === 0) return emptyLabel;
  return `${result.rangeStart}–${result.rangeEnd} of ${result.total}`;
}
