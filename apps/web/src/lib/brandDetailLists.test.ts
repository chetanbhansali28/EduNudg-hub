import { describe, expect, it } from "vitest";
import {
  BRAND_DETAIL_LIST_PAGE_SIZE,
  brandDetailPaginationSummary,
  paginateBrandDetailList,
  shouldPaginateBrandDetailList,
} from "./brandDetailLists";

describe("brandDetailLists", () => {
  it("paginates after ten rows", () => {
    expect(shouldPaginateBrandDetailList(BRAND_DETAIL_LIST_PAGE_SIZE)).toBe(false);
    expect(shouldPaginateBrandDetailList(BRAND_DETAIL_LIST_PAGE_SIZE + 1)).toBe(true);
  });

  it("summarizes range like the brands directory", () => {
    const items = Array.from({ length: 12 }, (_, index) => index);
    const page = paginateBrandDetailList(items, 2);
    expect(page.items).toEqual([10, 11]);
    expect(brandDetailPaginationSummary(page, "No centers")).toBe("11–12 of 12");
    expect(brandDetailPaginationSummary(paginateBrandDetailList([], 1), "No domains")).toBe("No domains");
  });
});
