import { describe, expect, it } from "vitest";
import {
  brandStatusLabel,
  brandsPaginationSummary,
  filterBrands,
  formatGrowthPercent,
  formatStudentCount,
  paginateItems,
  pendingReviewLabel,
  resolveBrandsList,
  shouldShowBrandsListControls,
  sortBrands,
} from "./platformBrandsHelpers";

describe("platformBrandsHelpers", () => {
  it("formats student counts compactly", () => {
    expect(formatStudentCount(12_400)).toBe("12.4k");
    expect(formatStudentCount(250)).toBe("250");
  });

  it("formats growth percent with sign", () => {
    expect(formatGrowthPercent(18)).toBe("+18%");
    expect(formatGrowthPercent(-4.2)).toBe("-4.2%");
  });

  it("filters brands by name or slug", () => {
    const brands = [
      { id: "1", slug: "alpha", name: "Alpha Academy", status: "active" as const, logo_url: null },
      { id: "2", slug: "beta", name: "Beta School", status: "active" as const, logo_url: null },
    ];
    expect(filterBrands(brands, "beta")).toHaveLength(1);
    expect(filterBrands(brands, "Academy")).toHaveLength(1);
  });

  it("regression_pending_review_label_is_zero_padded", () => {
    expect(pendingReviewLabel(3)).toBe("03");
    expect(brandStatusLabel("active")).toBe("ACTIVE");
  });

  it("shows list controls only when more than ten brands", () => {
    expect(shouldShowBrandsListControls(10)).toBe(false);
    expect(shouldShowBrandsListControls(11)).toBe(true);
  });

  it("sorts and paginates brands for large lists", () => {
    const brands = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      slug: `brand-${index}`,
      name: `Brand ${index}`,
      status: "active" as const,
      logo_url: null,
    }));

    const sorted = sortBrands(brands, "name-desc");
    expect(sorted[0]?.name).toBe("Brand 9");

    const page = paginateItems(sorted, 2, 10);
    expect(page.items).toHaveLength(2);
    expect(brandsPaginationSummary(page)).toBe("11–12 of 12");

    const resolved = resolveBrandsList(brands, {
      showControls: true,
      search: "brand-1",
      sort: "slug-asc",
      page: 1,
    });
    expect(resolved.total).toBeGreaterThan(0);
  });
});
