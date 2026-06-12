import { learnPortalUrl } from "@/lib/brandPortalUrl";

/** Student/parent learn portal sign-in for a brand (external host). */
export function learnPortalLoginUrl(brandSlug: string): string {
  const base = learnPortalUrl(brandSlug).replace(/\/$/, "");
  return `${base}/login`;
}

export const CENTER_STAFF_LOGIN_PATH = "/login";
