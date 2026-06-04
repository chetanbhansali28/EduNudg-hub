import { describe, expect, it } from "vitest";
import { getPortalMode } from "./portalMode";

describe("getPortalMode", () => {
  it("returns platform on marketing host without brand", () => {
    expect(getPortalMode({ portalType: "platform", brandSlug: null, centerSlug: null } as never)).toBe("platform");
  });

  it("returns brand on brand host", () => {
    expect(getPortalMode({ portalType: "brand", brandSlug: "abacus", centerSlug: null } as never)).toBe("brand");
  });

  it("returns center on center host", () => {
    expect(
      getPortalMode({ portalType: "center", brandSlug: "abacus", centerSlug: "koramangala" } as never)
    ).toBe("center");
  });
});
