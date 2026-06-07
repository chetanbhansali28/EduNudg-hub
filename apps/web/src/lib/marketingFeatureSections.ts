import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageFeatureSection } from "@/types/homepage";

/** Rotating card colors/icons for Abacus Classic program marquee (by program order). */
export const ABACUS_PROGRAM_CARD_PALETTE = [
  { bg: "#2563eb", icon: "▦" },
  { bg: "#84cc16", icon: "⚡" },
  { bg: "#f87171", icon: "✎" },
  { bg: "#06b6d4", icon: "★" },
  { bg: "#a855f7", icon: "◆" },
  { bg: "#f97316", icon: "●" },
] as const;

export function programCardPalette(index: number) {
  return ABACUS_PROGRAM_CARD_PALETTE[index % ABACUS_PROGRAM_CARD_PALETTE.length]!;
}

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
