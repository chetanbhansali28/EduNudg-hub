import { describe, expect, it } from "vitest";
import {
  filterMerchandiseCatalog,
  matchesMerchandiseSearch,
  merchandiseCatalogCounts,
  merchandisePageCounts,
} from "./merchandisePageHelpers";

const kit = { sku: "KIT001", name: "Level 1 Kit", is_active: true };
const workbook = { sku: "WB-DRAFT", name: "Workbook draft", is_active: false };

describe("merchandisePageHelpers", () => {
  it("counts active, draft, and total catalog items", () => {
    expect(merchandiseCatalogCounts([kit, workbook])).toEqual({ active: 1, draft: 1, total: 2 });
  });

  it("includes franchise order count on the page stats strip", () => {
    expect(merchandisePageCounts([kit, workbook], 3)).toEqual({
      active: 1,
      draft: 1,
      total: 2,
      orders: 3,
    });
  });

  it("filters catalog by active/draft tab and search", () => {
    expect(filterMerchandiseCatalog([kit, workbook], "active")).toEqual([kit]);
    expect(filterMerchandiseCatalog([kit, workbook], "draft")).toEqual([workbook]);
    expect(filterMerchandiseCatalog([kit, workbook], "all", "workbook")).toEqual([workbook]);
    expect(matchesMerchandiseSearch(kit, "KIT001")).toBe(true);
    expect(matchesMerchandiseSearch(kit, "missing")).toBe(false);
  });
});
