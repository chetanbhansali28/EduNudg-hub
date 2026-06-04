import { describe, expect, it } from "vitest";
import { buildCenterLandingConfig } from "./centerLandingDefaults";

describe("buildCenterLandingConfig", () => {
  it("regression_parent_focused_enrollment_cta", () => {
    const config = buildCenterLandingConfig(
      "Abacus World Koramangala",
      "Abacus World",
      "Bengaluru"
    );
    expect(config.hero.ctaHref).toBe("#enroll");
    expect(config.nav.ctaLabel).toBe("Book a free trial");
    expect(config.hero.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.footerCta.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.hero.subtitle).toContain("Abacus World Koramangala");
    expect(config.faq.some((f) => f.question.toLowerCase().includes("trial"))).toBe(true);
  });
});
