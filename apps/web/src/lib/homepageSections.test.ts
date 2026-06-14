import { describe, expect, it } from "vitest";
import {
  ABACUS_CLASSIC_SECTION_DEFAULTS,
  DEFAULT_HOMEPAGE_SECTION_VISIBILITY,
  isAbacusSectionEnabled,
  isSectionEnabled,
  mergeSectionVisibility,
  setSectionEnabled,
} from "./homepageSections";
import { DEFAULT_HOMEPAGE_CONFIG } from "./homepageDefaults";
import { mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";

describe("homepageSections", () => {
  it("defaults all sections to enabled", () => {
    expect(DEFAULT_HOMEPAGE_SECTION_VISIBILITY.hero).toBe(true);
    expect(mergeSectionVisibility({ highlights: false }).highlights).toBe(false);
    expect(mergeSectionVisibility({ highlights: false }).hero).toBe(true);
  });

  it("regression_isSectionEnabled_respects_partial_config", () => {
    const config = setSectionEnabled(DEFAULT_HOMEPAGE_CONFIG, "highlights", false);
    expect(isSectionEnabled(config, "highlights")).toBe(false);
    expect(isSectionEnabled(DEFAULT_HOMEPAGE_CONFIG, "highlights")).toBe(true);
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
});
