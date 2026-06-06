import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { isBrandLandingBundleReady, normalizeBrandLandingBundle } from "./brandLandingBundle";

describe("normalizeBrandLandingBundle", () => {
  it("regression_accepts_bundle_shape", () => {
    const config = buildBrandLandingConfig("Abacus World");
    const bundle = normalizeBrandLandingBundle({ config, publicCurriculum: [] });
    expect(isBrandLandingBundleReady(bundle)).toBe(true);
    expect(bundle?.config.hero.line1).toBeTruthy();
  });

  it("regression_upgrades_legacy_bare_homepage_config_cache", () => {
    const config = buildBrandLandingConfig("Abacus World");
    const bundle = normalizeBrandLandingBundle(config);
    expect(isBrandLandingBundleReady(bundle)).toBe(true);
    expect(bundle?.publicCurriculum).toEqual([]);
  });

  it("returns null for invalid cache payload", () => {
    expect(normalizeBrandLandingBundle(null)).toBeNull();
    expect(normalizeBrandLandingBundle({ config: {} })).toBeNull();
    expect(isBrandLandingBundleReady(null)).toBe(false);
  });
});
