/** Duplicate the set so a CSS marquee can loop without a visible jump. */
export function sparkGalleryMarqueeLoop<T>(photos: T[]): T[] {
  if (photos.length <= 1) return photos;
  return [...photos, ...photos];
}

export function sparkGalleryMarqueeDurationSec(photoCount: number): number {
  if (photoCount <= 1) return 0;
  return Math.max(28, photoCount * 6);
}
