import { describe, expect, it } from "vitest";
import {
  buildCatalogPhotoCells,
  catalogItemDescription,
  catalogStatusBadge,
  formatCatalogSku,
  photoAssetsLabel,
} from "./brandMerchandiseHelpers";

describe("brandMerchandiseHelpers", () => {
  it("maps catalog status badges", () => {
    expect(catalogStatusBadge(true)).toEqual({ label: "Active", tone: "active" });
    expect(catalogStatusBadge(false)).toEqual({ label: "Draft", tone: "draft" });
  });

  it("builds photo asset label and sku copy", () => {
    expect(photoAssetsLabel(2)).toBe("Product Assets (2/5 uploaded)");
    expect(formatCatalogSku("KIT001")).toBe("SKU: KIT001");
  });

  it("regression_catalog_item_description_uses_name", () => {
    expect(catalogItemDescription("Level 1 Kit")).toContain("foundational abacus training");
    expect(catalogItemDescription("Level 2 Kit")).toContain("multidigit calculations");
  });

  it("buildCatalogPhotoCells renders all slots with upload on first empty", () => {
    const cells = buildCatalogPhotoCells([
      "https://cdn.example/1.jpg",
      "https://cdn.example/2.jpg",
      "",
      "",
      "",
    ]);
    expect(cells).toHaveLength(5);
    expect(cells[0]).toEqual({ kind: "image", slot: 1, url: "https://cdn.example/1.jpg" });
    expect(cells[1]).toEqual({ kind: "image", slot: 2, url: "https://cdn.example/2.jpg" });
    expect(cells[2]).toEqual({ kind: "upload", slot: 3 });
    expect(cells[3]).toEqual({ kind: "empty", slot: 4 });
    expect(cells[4]).toEqual({ kind: "empty", slot: 5 });
  });
});
