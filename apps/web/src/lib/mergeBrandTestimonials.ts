import type { HomepageConfig, HomepageTestimonial } from "@/types/homepage";
import { setSectionEnabled } from "@/lib/homepageSections";

export type PublicSuccessStory = {
  quote: string;
  author: string;
  rating?: number | null;
  title?: string | null;
};

function isTestimonialsNavHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  return normalized === "#testimonials" || normalized === "#testimonialssection";
}

export function hasPublicTestimonials(
  testimonials: HomepageConfig["testimonials"] | undefined
): boolean {
  return Boolean(
    testimonials?.items?.some((item) => item.quote?.trim() && item.author?.trim())
  );
}

export function mergePublishedSuccessStories(
  testimonials: HomepageConfig["testimonials"],
  stories: PublicSuccessStory[]
): HomepageConfig["testimonials"] {
  if (stories.length === 0) {
    return { ...testimonials, items: [] };
  }

  const items: HomepageTestimonial[] = stories.map((s) => ({
    quote: s.quote,
    author: s.author,
    role: s.title?.trim() || undefined,
  }));

  return { ...testimonials, items };
}

/** Public brand/franchise landings show published success stories only — never theme dummy quotes. */
export function applyPublishedSuccessStoriesToPublicLanding(
  config: HomepageConfig,
  stories: PublicSuccessStory[]
): HomepageConfig {
  const withStories = {
    ...config,
    testimonials: mergePublishedSuccessStories(config.testimonials, stories),
  };

  if (stories.length > 0) {
    return setSectionEnabled(withStories, "testimonials", true);
  }

  const hidden = setSectionEnabled(withStories, "testimonials", false);
  return {
    ...hidden,
    nav: {
      ...hidden.nav,
      links: hidden.nav.links.filter((link) => !isTestimonialsNavHref(link.href)),
    },
  };
}
