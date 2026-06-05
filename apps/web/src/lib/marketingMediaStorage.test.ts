import { describe, expect, it } from "vitest";
import { marketingMediaObjectPath } from "./marketingMediaStorage";

describe("marketingMediaObjectPath", () => {
  it("regression_platform_scope_uses_flat_brand_assets_root", () => {
    const file = new File(["x"], "hero-bg.png", { type: "image/png" });
    const path = marketingMediaObjectPath({ kind: "platform" }, "hero-background", file);
    expect(path.includes("/")).toBe(false);
    expect(path.endsWith(".png")).toBe(true);
    expect(/^\d+-hero-bg\.png$/.test(path)).toBe(true);
  });

  it("regression_brand_scope_uses_brand_uuid_folder", () => {
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const path = marketingMediaObjectPath(
      { kind: "brand", brandId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      "feature-organize",
      file
    );
    expect(path.startsWith("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/marketing/feature-organize/")).toBe(true);
    expect(path.endsWith(".mp4")).toBe(true);
  });
});
