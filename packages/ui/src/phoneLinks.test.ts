import { describe, expect, it } from "vitest";
import { telHref } from "./phoneLinks";

describe("telHref", () => {
  it("strips formatting for tel links", () => {
    expect(telHref("+91 98765 43210")).toBe("tel:+919876543210");
  });

  it("returns null for empty values", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("   ")).toBeNull();
  });
});
