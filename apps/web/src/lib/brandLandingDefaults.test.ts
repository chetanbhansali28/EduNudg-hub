import { describe, expect, it } from "vitest";
import { mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";

describe("mergeAbacusClassicLandingConfig", () => {
  it("includes dual CTAs and trust media defaults", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(config.nav.secondaryCtaLabel).toBe("Apply franchise");
    expect(config.trustMedia?.cards).toHaveLength(3);
    expect(config.founders).toHaveLength(1);
    expect(config.sections?.featureScroll).toBe(false);
    expect(config.sections?.featureGrid).toBe(true);
  });

  it("sprint2_dual_ctas_on_nav_and_hero", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(config.nav.ctaLabel).toBe("Book free demo");
    expect(config.nav.ctaHref).toBe("enroll");
    expect(config.nav.secondaryCtaHref).toBe("apply");
    expect(config.hero.ctaHref).toBe("enroll");
    expect(config.hero.secondaryCtaLabel).toBe("Apply franchise");
    expect(config.hero.secondaryCtaHref).toBe("apply");
    expect(config.hero.badge).toBe("FOR AGED 6–14 YEARS");
  });

  it("sprint2_four_feature_blocks_for_grid", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(config.featureSections).toHaveLength(4);
    expect(config.featureSections.map((s) => s.id)).toEqual(["levels", "vedic", "competition", "franchise"]);
  });

  it("sprint2_enables_programs_grid_section", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(config.sections?.programsGrid).toBe(true);
    expect(config.sections?.hero).toBe(true);
    expect(config.programsSection?.title).toBe("World-Class Brain Development");
    expect(config.programsSection?.defaultScholarshipHighlight).toContain("Scholarship");
    expect(config.programsSection?.cards).toHaveLength(3);
    expect(config.programsSection?.cards?.[0]?.name).toBe("Abacus (Mental Math)");
  });

  it("sprint3_includes_founders_trust_gallery_and_rich_footer_defaults", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(config.founders?.[0]?.roleBadge).toBe("FOUNDER & CEO");
    expect(config.trustMedia?.cards).toHaveLength(3);
    expect(config.trustMedia?.titleHighlight).toBe("Smart Brain Abacus");
    expect(config.gallery?.images).toEqual([]);
    expect(config.footer.rich?.showLiveStats).toBe(true);
    expect(config.footer.rich?.badges?.[0]?.label).toBe("ISO 9001:2015 Certified");
    expect(config.sections?.founders).toBe(true);
    expect(config.sections?.trustMedia).toBe(true);
    expect(config.sections?.gallery).toBe(true);
    expect(config.sections?.footerRich).toBe(true);
  });
});
