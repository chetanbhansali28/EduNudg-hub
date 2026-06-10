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
  | "programsGrid"
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
  programsGrid: true,
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
  programsGrid: true,
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
  programsGrid: true,
  featureGrid: true,
  founders: true,
  trustMedia: true,
  gallery: false,
  footerRich: true,
};

export type HomepageSectionVisibilityInput = HomepageSectionVisibility & {
  /** @deprecated Renamed to programsGrid — still read from saved brand_settings JSON. */
  programsMarquee?: boolean;
};

/** Map legacy `programsMarquee` toggle from saved brand_settings JSON. */
function normalizeSectionPartial(
  partial?: HomepageSectionVisibilityInput
): HomepageSectionVisibility | undefined {
  if (!partial) return partial;
  const legacy = partial.programsMarquee;
  if (legacy === undefined || partial.programsGrid !== undefined) return partial;
  const { programsMarquee: _removed, ...rest } = partial;
  return { ...rest, programsGrid: legacy };
}

export function mergeSectionVisibility(
  partial?: HomepageSectionVisibilityInput,
  themeDefaults: Record<HomepageSectionKey, boolean> = DEFAULT_HOMEPAGE_SECTION_VISIBILITY
): Record<HomepageSectionKey, boolean> {
  const normalized = normalizeSectionPartial(partial);
  return { ...themeDefaults, ...normalized };
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
