import type { HomepageConfig } from "@/types/homepage";

/** Keys for major marketing page blocks controlled from the homepage editor. */
export type HomepageSectionKey =
  | "hero"
  | "featureScroll"
  | "highlights"
  | "privacy"
  | "testimonials"
  | "faq"
  | "footer";

export type HomepageSectionVisibility = Record<HomepageSectionKey, boolean>;

export const DEFAULT_HOMEPAGE_SECTION_VISIBILITY: HomepageSectionVisibility = {
  hero: true,
  featureScroll: true,
  highlights: true,
  privacy: true,
  testimonials: true,
  faq: true,
  footer: true,
};

export function mergeSectionVisibility(
  partial?: Partial<HomepageSectionVisibility>
): HomepageSectionVisibility {
  return { ...DEFAULT_HOMEPAGE_SECTION_VISIBILITY, ...partial };
}

export function isSectionEnabled(config: HomepageConfig, key: HomepageSectionKey): boolean {
  return mergeSectionVisibility(config.sections)[key];
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
