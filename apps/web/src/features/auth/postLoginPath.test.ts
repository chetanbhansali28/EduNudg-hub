import { describe, expect, it } from "vitest";
import { postLoginPath, preservedPortalSearch } from "./postLoginPath";

describe("postLoginPath", () => {
  it("sends platform users to /admin", () => {
    expect(postLoginPath({ portalType: "platform" })).toBe("/admin");
  });

  it("sends brand users to /app and center users to portal root", () => {
    expect(postLoginPath({ portalType: "brand" })).toBe("/app");
    expect(postLoginPath({ portalType: "center" })).toBe("/app");
  });

  it("sends learn and parents portals to student home", () => {
    expect(postLoginPath({ portalType: "learn" })).toBe("/");
    expect(postLoginPath({ portalType: "parents" })).toBe("/");
  });

  it("regression_preserves_same_origin_franchise_portal_query", () => {
    expect(
      preservedPortalSearch(
        new URLSearchParams("portal=center&brand=abacusworld&center=pune&next=/app")
      )
    ).toBe("?portal=center&brand=abacusworld&center=pune");
  });
});
