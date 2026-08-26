import { portalLoginUrl } from "@/lib/brandPortalUrl";

/**
 * Student/parent learn portal sign-in for a brand.
 * Local: `http://learn.{brand}.localhost:9000/login`
 * Vercel same-origin: `/login?portal=learn&brand=…` (path before `?` — never append `/login` after the query).
 */
export function learnPortalLoginUrl(brandSlug: string): string {
  return portalLoginUrl({ portalType: "learn", brandSlug });
}

export const CENTER_STAFF_LOGIN_PATH = "/login";
