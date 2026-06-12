import { describe, expect, it } from "vitest";
import { buildCenterLandingConfig, mergeAbacusClassicCenterLandingConfig } from "./centerLandingDefaults";

describe("buildCenterLandingConfig", () => {
  it("regression_parent_focused_enrollment_cta", () => {
    const config = buildCenterLandingConfig(
      "Abacus World Koramangala",
      "Abacus World",
      "Bengaluru"
    );
    expect(config.hero.ctaHref).toBe("#enroll");
    expect(config.nav.ctaLabel).toBe("Book a free trial");
    expect(config.nav.links.some((l) => l.label.toLowerCase() === "enroll")).toBe(false);
    expect(config.hero.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.footerCta.ctaLabel).toBe(config.nav.ctaLabel);
    expect(config.hero.subtitle).toContain("Abacus World Koramangala");
    expect(config.faq.some((f) => f.question.toLowerCase().includes("trial"))).toBe(true);
  });
});

describe("mergeAbacusClassicCenterLandingConfig", () => {
  it("uses abacus sections with center-local hero copy", () => {
    const config = mergeAbacusClassicCenterLandingConfig(
      "Smart Brain Pune",
      "Smart Brain Abacus",
      "Pune"
    );
    expect(config.sections?.programsGrid).toBe(true);
    expect(config.sections?.featureScroll).toBe(false);
    expect(config.hero.subtitle).toContain("Smart Brain Pune");
    expect(config.hero.subtitle).toContain("Pune");
    expect(config.programsSection?.eyebrow).toBe("WHAT WE TEACH");
    expect(config.trustMedia?.cards).toHaveLength(3);
  });
});
