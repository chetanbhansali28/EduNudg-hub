import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig } from "./brandLandingDefaults";

describe("buildBrandLandingConfig", () => {
  it("regression_abacusworld_franchise_hero_copy", () => {
    const config = buildBrandLandingConfig("Abacus World");
    expect(config.meta.siteName).toBe("Abacus World");
    expect(config.hero.line1Serif).toContain("Abacus World");
    expect(config.nav.links.some((l) => l.href === "#apply")).toBe(true);
    expect(config.footer.companyLinks.some((l) => l.href === "/login")).toBe(true);
  });
});
