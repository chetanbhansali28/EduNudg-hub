export const SPARK_GALLERY_MOBILE_MQ = "(max-width: 767px)";
export const SPARK_GALLERY_AUTOSCROLL_MS = 4000;

export function galleryColumnCount(photoCount: number): number {
  return Math.ceil(photoCount / 2);
}

export function nextGalleryColumnIndex(current: number, count: number): number {
  if (count <= 1) return 0;
  return (current + 1) % count;
}

export function shouldAutoScrollGallery(options: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
  columnCount: number;
}): boolean {
  return options.isMobile && !options.prefersReducedMotion && options.columnCount > 1;
}

export function galleryColumnIndexFromScroll(track: HTMLElement): number {
  const items = [...track.querySelectorAll<HTMLElement>(".sa-gallery__item")];
  if (items.length === 0) return 0;
  const left = track.scrollLeft;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  items.forEach((item, i) => {
    const dist = Math.abs(item.offsetLeft - track.offsetLeft - left);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return Math.floor(best / 2);
}

export function scrollGalleryCarouselToColumn(
  track: HTMLElement,
  index: number,
  behavior: ScrollBehavior = "smooth"
): void {
  const items = track.querySelectorAll<HTMLElement>(".sa-gallery__item");
  const item = items[index * 2];
  if (!item) return;
  track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior });
}
