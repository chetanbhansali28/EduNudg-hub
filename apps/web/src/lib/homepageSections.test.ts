import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_SECTION_VISIBILITY,
  isSectionEnabled,
  mergeSectionVisibility,
  setSectionEnabled,
} from "./homepageSections";
import { DEFAULT_HOMEPAGE_CONFIG } from "./homepageDefaults";

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
});
