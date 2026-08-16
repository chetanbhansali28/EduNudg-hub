import type { HomepageTestimonial } from "@/types/homepage";

export const SPARK_TESTIMONIALS_MOBILE_MQ = "(max-width: 767px)";
export const SPARK_TESTIMONIALS_AUTOSCROLL_MS = 4000;

export function parseTestimonialAuthor(item: HomepageTestimonial): { name: string; role: string } {
  if (item.role?.trim()) {
    return { name: item.author.trim(), role: item.role.trim() };
  }

  const parts = item.author.split(/\s*[·|,]\s*/);
  if (parts.length >= 2) {
    return { name: parts[0]!.trim(), role: parts.slice(1).join(", ").trim() };
  }

  return { name: item.author.trim(), role: "" };
}

export function nextCarouselIndex(current: number, count: number): number {
  if (count <= 1) return 0;
  return (current + 1) % count;
}

export function shouldAutoScrollTestimonials(options: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
  itemCount: number;
}): boolean {
  return options.isMobile && !options.prefersReducedMotion && options.itemCount > 1;
}

export function carouselIndexFromScroll(track: HTMLElement): number {
  const cards = [...track.querySelectorAll<HTMLElement>(".sa-testimonial-card")];
  if (cards.length === 0) return 0;
  const left = track.scrollLeft;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  cards.forEach((card, i) => {
    const dist = Math.abs(card.offsetLeft - track.offsetLeft - left);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

export function scrollTestimonialsCarouselToIndex(
  track: HTMLElement,
  index: number,
  behavior: ScrollBehavior = "smooth"
): void {
  const cards = track.querySelectorAll<HTMLElement>(".sa-testimonial-card");
  const card = cards[index];
  if (!card) return;
  track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior });
}
