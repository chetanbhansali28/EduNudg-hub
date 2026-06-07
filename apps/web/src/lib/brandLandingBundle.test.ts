import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
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
    expect(bundle?.marketingTheme).toBe("novu");
    expect(bundle?.publicStats).toEqual({ centersCount: 0, studentsCount: 0 });
  });

  it("sprint1_preserves_marketing_theme_and_public_stats", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const bundle = normalizeBrandLandingBundle({
      config,
      publicCurriculum: [],
      marketingTheme: "abacus-classic",
      publicStats: { centersCount: 12, studentsCount: 5000 },
    });

    expect(bundle?.marketingTheme).toBe("abacus-classic");
    expect(bundle?.publicStats).toEqual({ centersCount: 12, studentsCount: 5000 });
  });

  it("sprint1_defaults_invalid_marketing_theme_to_novu", () => {
    const config = buildBrandLandingConfig("Demo");
    const bundle = normalizeBrandLandingBundle({
      config,
      publicCurriculum: [],
      marketingTheme: "unknown-theme",
      publicStats: { centers_count: 3, students_count: 99 },
    });

    expect(bundle?.marketingTheme).toBe("novu");
    expect(bundle?.publicStats).toEqual({ centersCount: 3, studentsCount: 99 });
  });

  it("returns null for invalid cache payload", () => {
    expect(normalizeBrandLandingBundle(null)).toBeNull();
    expect(normalizeBrandLandingBundle({ config: {} })).toBeNull();
    expect(isBrandLandingBundleReady(null)).toBe(false);
  });
});
