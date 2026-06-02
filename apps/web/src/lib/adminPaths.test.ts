import { describe, expect, it } from "vitest";
import { brandAdminPath, isUuid } from "./adminPaths";

describe("adminPaths", () => {
  it("builds slug-based brand path", () => {
    expect(brandAdminPath("abacusworld")).toBe("/admin/brands/abacusworld");
  });

  it("detects uuid params for legacy redirect", () => {
    expect(isUuid("a0000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("abacusworld")).toBe(false);
  });
});
