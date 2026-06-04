import type { HomepageConfig, HomepageTestimonial } from "@/types/homepage";

export type PublicSuccessStory = {
  quote: string;
  author: string;
  rating?: number | null;
  title?: string | null;
};

export function mergePublishedSuccessStories(
  testimonials: HomepageConfig["testimonials"],
  stories: PublicSuccessStory[]
): HomepageConfig["testimonials"] {
  if (stories.length === 0) return testimonials;

  const items: HomepageTestimonial[] = stories.map((s) => ({
    quote: s.quote,
    author: s.author,
  }));

  return { ...testimonials, items };
}
