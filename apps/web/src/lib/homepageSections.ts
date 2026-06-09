import type { HomepageConfig } from "@/types/homepage";

/** Keys for major marketing page blocks controlled from the homepage editor. */
export type HomepageSectionKey =
  | "hero"
  | "featureScroll"
  | "highlights"
  | "privacy"
  | "testimonials"
  | "faq"
  | "footer"
  | "programsMarquee"
  | "featureGrid"
  | "founders"
  | "trustMedia"
  | "gallery"
  | "footerRich";

export type HomepageSectionVisibility = Partial<Record<HomepageSectionKey, boolean>>;

export const DEFAULT_HOMEPAGE_SECTION_VISIBILITY: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: true,
  highlights: true,
  privacy: true,
  testimonials: true,
  faq: true,
  footer: true,
  programsMarquee: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
};

export const ABACUS_CLASSIC_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: true,
  faq: true,
  footer: false,
  programsMarquee: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: true,
  footerRich: true,
};

export const SPARK_ACADEMY_SECTION_DEFAULTS: Record<HomepageSectionKey, boolean> = {
  hero: true,
  featureScroll: false,
  highlights: false,
  privacy: false,
  testimonials: true,
  faq: true,
  footer: true,
  programsMarquee: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: false,
  footerRich: true,
};

export function mergeSectionVisibility(
  partial?: HomepageSectionVisibility,
  themeDefaults: Record<HomepageSectionKey, boolean> = DEFAULT_HOMEPAGE_SECTION_VISIBILITY
): Record<HomepageSectionKey, boolean> {
  return { ...themeDefaults, ...partial };
}

export function isSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections)[key];
}

export function isAbacusSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, ABACUS_CLASSIC_SECTION_DEFAULTS)[key];
}

export function isSparkSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections, SPARK_ACADEMY_SECTION_DEFAULTS)[key];
}

export function setSectionEnabled(
  config: HomepageConfig,
  key: HomepageSectionKey,
  enabled: boolean
): HomepageConfig {
  return {
    ...config,
    sections: { ...mergeSectionVisibility(config.sections), [key]: enabled },
  };
}
