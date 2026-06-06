import { describe, expect, it } from "vitest";
import { marketingMediaFolder, marketingMediaObjectPath } from "./marketingMediaStorage";

describe("marketingMediaObjectPath", () => {
  it("regression_platform_scope_uses_stable_slot_path", () => {
    const file = new File(["x"], "hero-bg.png", { type: "image/png" });
    const path = marketingMediaObjectPath({ kind: "platform" }, "hero-background", file);
    expect(path).toBe("platform/marketing/hero-background/asset.png");
  });

  it("regression_platform_logo_uses_fixed_root_path", () => {
    const file = new File(["x"], "logo.svg", { type: "image/svg+xml" });
    const path = marketingMediaObjectPath({ kind: "platform-logo" }, "", file);
    expect(path).toBe("platform-logo.svg");
  });

  it("regression_brand_scope_uses_stable_brand_slot_path", () => {
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const path = marketingMediaObjectPath(
      { kind: "brand", brandId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      "feature-organize",
      file
    );
    expect(path).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/marketing/feature-organize/asset.mp4"
    );
  });
});

describe("marketingMediaFolder", () => {
  it("maps brand and platform folders under marketing", () => {
    expect(marketingMediaFolder({ kind: "platform" }, "footer-background")).toBe(
      "platform/marketing/footer-background"
    );
    expect(
      marketingMediaFolder({ kind: "brand", brandId: "b1" }, "hero-background")
    ).toBe("b1/marketing/hero-background");
  });
});
