import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { applyCanonicalSiteName, applyCurriculumNavLink } from "./marketingPublicSite";

describe("marketingPublicSite", () => {
  it("regression_preserves_site_name_casing", () => {
    const config = buildBrandLandingConfig("Abacus World");
    const next = applyCanonicalSiteName(config, "KORAMANGALA Abacus Center");
    expect(next.meta.siteName).toBe("KORAMANGALA Abacus Center");
  });

  it("regression_adds_curriculum_nav_when_programs_exist", () => {
    const config = buildBrandLandingConfig("Abacus World");
    expect(config.nav.links.some((l) => l.href === "#curriculum")).toBe(false);

    const withNav = applyCurriculumNavLink(config, true);
    expect(withNav.nav.links.some((l) => l.href === "#curriculum")).toBe(true);
  });

  it("regression_hides_curriculum_nav_when_no_programs", () => {
    const config = buildBrandLandingConfig("Abacus World");
    const withNav = applyCurriculumNavLink(config, true);
    const without = applyCurriculumNavLink(withNav, false);
    expect(without.nav.links.some((l) => l.href === "#curriculum")).toBe(false);
  });
});
