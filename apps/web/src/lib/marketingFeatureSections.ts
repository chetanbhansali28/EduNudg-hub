import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageFeatureSection } from "@/types/homepage";

/** Ensures each feature block has a phone-stage video when brand/center copy omits URLs. */
export function withDefaultFeatureVideos(
  sections: HomepageFeatureSection[]
): HomepageFeatureSection[] {
  const defaults = DEFAULT_HOMEPAGE_CONFIG.featureSections;
  return sections.map((section, i) => ({
    ...section,
    videoUrl: section.videoUrl ?? defaults[i]?.videoUrl,
  }));
}
