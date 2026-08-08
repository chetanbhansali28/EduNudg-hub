import { describe, expect, it } from "vitest";
import { isSafeInternalPath, resolveSafeInternalPath } from "./safeInternalPath";

describe("safeInternalPath", () => {
  it("accepts normal app paths", () => {
    expect(isSafeInternalPath("/admin")).toBe(true);
    expect(isSafeInternalPath("/app/settings")).toBe(true);
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.com")).toBe(false);
  });

  it("resolveSafeInternalPath falls back when unsafe", () => {
    expect(resolveSafeInternalPath("//evil.com", "/admin")).toBe("/admin");
    expect(resolveSafeInternalPath("/app", "/admin")).toBe("/app");
  });
});
