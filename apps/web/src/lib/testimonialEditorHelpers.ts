/** Recommended quote length for marketing testimonials (soft validation). */
export const TESTIMONIAL_QUOTE_MIN = 50;
export const TESTIMONIAL_QUOTE_MAX = 100;

export function testimonialQuoteLengthHint(length: number): "ok" | "short" | "long" {
  if (length === 0) return "ok";
  if (length < TESTIMONIAL_QUOTE_MIN) return "short";
  if (length > TESTIMONIAL_QUOTE_MAX) return "long";
  return "ok";
}

export function formatTestimonialQuoteCount(length: number): string {
  return `${length} / ${TESTIMONIAL_QUOTE_MAX} characters (recommended ${TESTIMONIAL_QUOTE_MIN}–${TESTIMONIAL_QUOTE_MAX})`;
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed!);
  return next;
}
