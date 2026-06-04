import type { PublicSuccessStory } from "@/lib/mergeBrandTestimonials";

export function parsePublicSuccessStories(raw: unknown): PublicSuccessStory[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PublicSuccessStory =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as PublicSuccessStory).quote === "string" &&
      typeof (item as PublicSuccessStory).author === "string"
  );
}
