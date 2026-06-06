import { stripLogoCacheBust, withLogoCacheBust } from "@/lib/brandLogoCache";

export { stripLogoCacheBust as stripMediaCacheBust, withLogoCacheBust as withMediaCacheBust };

const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

/** True when a public media URL points at a video asset. */
export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return VIDEO_EXT.test(url.trim());
}
