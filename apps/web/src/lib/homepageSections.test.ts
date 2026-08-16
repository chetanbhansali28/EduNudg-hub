import { describe, expect, it } from "vitest";
import {
  ABACUS_CLASSIC_SECTION_DEFAULTS,
  DEFAULT_HOMEPAGE_SECTION_VISIBILITY,
  SPARK_ACADEMY_SECTION_DEFAULTS,
  isAbacusSectionEnabled,
  isSectionEnabled,
  mergeAbacusClassicSectionVisibility,
  mergeSectionVisibility,
  setSectionEnabled,
} from "./homepageSections";
import { DEFAULT_HOMEPAGE_CONFIG } from "./homepageDefaults";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";
import { landingConfigToPartial } from "./brandLandingEditorApi";

describe("homepageSections", () => {
  it("defaults all sections to enabled", () => {
    expect(DEFAULT_HOMEPAGE_SECTION_VISIBILITY.hero).toBe(true);
    expect(mergeSectionVisibility({ highlights: false }).highlights).toBe(false);
    expect(mergeSectionVisibility({ highlights: false }).hero).toBe(true);
  });

  it("regression_isSectionEnabled_respects_partial_config", () => {
    // DEFAULT_HOMEPAGE_CONFIG uses enterprise defaults (highlights off). Use an unset
    // sections map so merge falls back to DEFAULT_HOMEPAGE_SECTION_VISIBILITY.
    const base = { ...DEFAULT_HOMEPAGE_CONFIG, sections: undefined };
    const config = setSectionEnabled(base, "highlights", false);
    expect(isSectionEnabled(config, "highlights")).toBe(false);
    expect(isSectionEnabled(base, "highlights")).toBe(true);
  });

  it("sprint1_abacus_defaults_disable_novu_phone_scroll_sections", () => {
    expect(ABACUS_CLASSIC_SECTION_DEFAULTS.featureScroll).toBe(false);
    expect(ABACUS_CLASSIC_SECTION_DEFAULTS.highlights).toBe(false);
    expect(ABACUS_CLASSIC_SECTION_DEFAULTS.programsGrid).toBe(true);
    expect(ABACUS_CLASSIC_SECTION_DEFAULTS.curriculumSyllabus).toBe(true);
    expect(ABACUS_CLASSIC_SECTION_DEFAULTS.featureGrid).toBe(true);
  });

  it("sprint1_isAbacusSectionEnabled_uses_abacus_theme_defaults", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(isAbacusSectionEnabled(config, "featureScroll")).toBe(false);
    expect(isAbacusSectionEnabled(config, "programsGrid")).toBe(true);
    expect(isAbacusSectionEnabled(setSectionEnabled(config, "gallery", false), "gallery")).toBe(false);
  });

  it("maps legacy programsMarquee toggle to programsGrid", () => {
    expect(mergeSectionVisibility({ programsMarquee: false }).programsGrid).toBe(false);
    expect(mergeSectionVisibility({ programsMarquee: true, programsGrid: false }).programsGrid).toBe(false);
  });

  it("regression_novu_saved_sections_do_not_disable_abacus_syllabus", () => {
    const novuPartial = landingConfigToPartial(buildBrandLandingConfig("Abacus World 2"));
    const abacusSections = mergeAbacusClassicSectionVisibility(novuPartial);
    expect(abacusSections.curriculumSyllabus).toBe(true);
    expect(abacusSections.programsGrid).toBe(true);
    expect(abacusSections.founders).toBe(true);
  });

  it("regression_abacus_saved_sections_honor_editor_toggles", () => {
    const abacusPartial = landingConfigToPartial(
      mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      { marketingTheme: "abacus-classic" }
    );
    abacusPartial.sections = { ...abacusPartial.sections, gallery: false, curriculumSyllabus: false };
    const abacusSections = mergeAbacusClassicSectionVisibility(abacusPartial);
    expect(abacusSections.gallery).toBe(false);
    expect(abacusSections.curriculumSyllabus).toBe(false);
    expect(abacusSections.programsGrid).toBe(true);
  });
});

describe("Spark Academy section defaults", () => {
  it("regression_spark_curriculum_syllabus_defaults_on", () => {
    expect(SPARK_ACADEMY_SECTION_DEFAULTS.programsGrid).toBe(true);
    expect(SPARK_ACADEMY_SECTION_DEFAULTS.curriculumSyllabus).toBe(true);
  });
});
