import { hasCustomMarketingMedia } from "@/lib/marketingMediaGuard";
import type { HomepageConfig } from "@/types/homepage";

const PLACEHOLDER_FOUNDER_NAME_RE = /^(founder name|name|sample center)$/i;

function asLandingPartial(raw: unknown): Partial<HomepageConfig> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Partial<HomepageConfig>;
}

function hasRealFounder(landing: Partial<HomepageConfig>): boolean {
  return Boolean(
    landing.founders?.some((founder) => {
      const name = founder.name?.trim() ?? "";
      return name.length > 0 && !PLACEHOLDER_FOUNDER_NAME_RE.test(name);
    })
  );
}

/** True when stored brand `landing` / `center_landing` has been configured (not an empty seed). */
export function hasConfiguredMarketingLanding(raw: unknown): boolean {
  const landing = asLandingPartial(raw);
  if (!landing) return false;
  if (hasCustomMarketingMedia(landing)) return true;
  if (landing.meta?.logoUrl?.trim()) return true;
  if (landing.hero?.line1?.trim() || landing.hero?.line1Serif?.trim() || landing.hero?.line2?.trim()) return true;
  if ((landing.faq?.length ?? 0) > 0) return true;
  if ((landing.gallery?.images?.length ?? 0) > 0) return true;
  return hasRealFounder(landing);
}
