import { describe, expect, it } from "vitest";
import {
  mergeAbacusClassicLandingConfig,
  mergeSparkAcademyLandingConfig,
  mergeEduLearnLandingConfig,
  buildBrandLandingConfig,
  limitSparkThemeDefaultMentors,
} from "./brandLandingDefaults";
import type { HomepageFounderProfile } from "@/types/homepage";
import { isAbacusSectionEnabled } from "./homepageSections";
import { landingConfigToPartial } from "./brandLandingEditorApi";

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
    expect(config.footer.rich?.brandStats?.franchiseCount).toBe("2+");
    expect(config.footer.rich?.badges?.[0]?.label).toBe("ISO 9001:2015 Certified");
    expect(config.sections?.founders).toBe(true);
    expect(config.sections?.trustMedia).toBe(true);
    expect(config.sections?.gallery).toBe(true);
    expect(config.sections?.footerRich).toBe(true);
  });

  it("regression_novu_landing_keeps_shared_copy_and_abacus_sections_on_theme_merge", () => {
    const novuPartial = landingConfigToPartial(buildBrandLandingConfig("Abacus World 2"));
    novuPartial.hero!.line1 = "Custom hero from Novu editor";
    const config = mergeAbacusClassicLandingConfig("Abacus World 2", novuPartial);
    expect(config.hero.line1).toBe("Custom hero from Novu editor");
    expect(config.founders).toHaveLength(1);
    expect(config.programsSection?.cards).toHaveLength(3);
    expect(isAbacusSectionEnabled(config, "curriculumSyllabus")).toBe(true);
    expect(isAbacusSectionEnabled(config, "programsGrid")).toBe(true);
  });
});

const sparkStockMentor = (name: string, photoId: string): HomepageFounderProfile => ({
  roleBadge: "Mentor",
  name,
  title: "Example title",
  bio: "",
  photoUrl: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=480&h=600&q=80`,
});

describe("mergeSparkAcademyLandingConfig", () => {
  it("regression_spark_mentors_default_to_one_example_profile", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    expect(config.founders).toHaveLength(1);
    expect(config.founders?.[0]?.name).toBe("Sarah Johnson");
    expect(config.founders?.[0]?.roleBadge).toBe("Mentor");
    expect(config.founders?.[0]?.title).toBe("AI Expert & Data Scientist");
  });

  it("regression_spark_mentors_collapse_saved_stock_placeholders_to_one", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley", {
      founders: [
        sparkStockMentor("Sarah Johnson", "1573496359142-b8d87734a5a2"),
        sparkStockMentor("Michael Brown", "1472099645785-5658abf4ff4e"),
        sparkStockMentor("Rachel Adams", "1507003211169-0a1dd7228f2d"),
        sparkStockMentor("Maria Lopez", "1580489944761-15a19d654956"),
        sparkStockMentor("David Chen", "1500648767791-00dcc994a43e"),
      ],
    });
    expect(config.founders).toHaveLength(1);
    expect(config.founders?.[0]?.name).toBe("Sarah Johnson");
  });

  it("regression_spark_mentors_keep_custom_profiles_and_one_stock_example", () => {
    const custom: HomepageFounderProfile = {
      roleBadge: "FOUNDER",
      name: "Chetan Bhansali",
      title: "Brand owner",
      bio: "",
      photoUrl: "https://cdn.example/brand-founder.jpg",
    };
    const added: HomepageFounderProfile = {
      roleBadge: "FOUNDER",
      name: "",
      title: "",
      bio: "",
      photoUrl: "",
    };
    const config = mergeSparkAcademyLandingConfig("Digitley", {
      founders: [
        custom,
        sparkStockMentor("Sarah Johnson", "1573496359142-b8d87734a5a2"),
        sparkStockMentor("Michael Brown", "1472099645785-5658abf4ff4e"),
        added,
      ],
    });
    expect(config.founders?.map((row) => row.name)).toEqual(["Chetan Bhansali", "Sarah Johnson", ""]);
  });

  it("regression_spark_mentors_empty_list_stays_empty_after_delete", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley", { founders: [] });
    expect(config.founders).toEqual([]);
  });

  it("includes_journey_highlight_fields_on_trust_media", () => {
    const config = mergeSparkAcademyLandingConfig("Abacus World");
    expect(config.trustMedia?.imageUrl).toContain("unsplash.com");
    expect(config.trustMedia?.highlightLabel).toBe("Our Investment Fund Raised");
    expect(config.trustMedia?.highlightPrimary).toBe("1000+");
    expect(config.trustMedia?.highlightSecondary).toBe("20+");
    expect(config.trustMedia?.highlightCaption).toBe("Top mentors around the globe");
  });

  it("includes_features_showcase_defaults", () => {
    const config = mergeSparkAcademyLandingConfig("Abacus World");
    expect(config.featuresShowcase?.floatStatsLabel).toBe("Last month");
    expect(config.featuresShowcase?.floatStatsValue).toBe("25.20%");
    expect(config.featuresShowcase?.floatProgressLabel).toBe("Learning Progress");
    expect(config.featuresShowcase?.title).toContain("Powerful Features");
  });
});

describe("mergeEduLearnLandingConfig", () => {
  it("regression_edu_learn_defaults_match_screenshot_structure", () => {
    const config = mergeEduLearnLandingConfig("Abacus World");
    expect(config.hero.line1Serif).toBe("Learning");
    expect(config.hero.ctaLabel).toBe("Get Started");
    expect(config.nav.ctaLabel).toBe("Get Started");
    expect(config.nav.secondaryCtaLabel).toBe("Apply franchise");
    expect(config.nav.secondaryCtaHref).toBe("apply");
    expect(config.theme.accent).toBe("#f9a825");
    expect(config.theme.bgColor).toBe("#f6f3ed");
    expect(config.featureSections).toHaveLength(3);
    expect(config.gallery?.images).toHaveLength(3);
    expect(config.footerCta?.title).toMatch(/school partners/i);
    expect(config.sections?.footerCta).toBe(true);
    expect(config.sections?.programsGrid).toBe(true);
    expect(config.sections?.faq).toBe(true);
    expect(config.sections?.featureScroll).toBe(false);
  });

  it("regression_edu_learn_keeps_spark_courses_and_apply_franchise", () => {
    const spark = mergeSparkAcademyLandingConfig("Abacus World");
    const config = mergeEduLearnLandingConfig("Abacus World", landingConfigToPartial(spark));
    expect(config.nav.secondaryCtaLabel).toBe("Apply franchise");
    expect(config.nav.secondaryCtaHref).toBe("apply");
    expect(config.nav.links.some((link) => link.href === "#programs")).toBe(true);
    expect(config.sections?.programsGrid).toBe(true);
    expect(config.sections?.curriculumSyllabus).toBe(true);
    expect(config.faq.length).toBeGreaterThan(0);
  });
});

describe("limitSparkThemeDefaultMentors", () => {
  it("leaves a single profile unchanged", () => {
    const one = [sparkStockMentor("Sarah Johnson", "1573496359142-b8d87734a5a2")];
    expect(limitSparkThemeDefaultMentors(one)).toEqual(one);
  });
});
