import type { MarketingTheme } from "@/types/homepage";

/** CSS modifier class per marketing theme (null = default Novu). */
export const MARKETING_PAGE_MODIFIER: Record<MarketingTheme, string | null> = {
  novu: null,
  "abacus-classic": "marketing-page--abacus-classic",
  "spark-academy": "marketing-page--spark-academy",
  "edu-learn": "marketing-page--edu-learn",
};

export function marketingPageClassName(theme: MarketingTheme): string {
  const modifier = MARKETING_PAGE_MODIFIER[theme];
  return modifier ? `marketing-page ${modifier}` : "marketing-page";
}

export function themeUsesLeadModals(theme: MarketingTheme): boolean {
  return theme === "abacus-classic" || theme === "spark-academy" || theme === "edu-learn";
}

/** Abacus / Spark / EduLearn share the accordion homepage editor. */
export function usesAlternateThemeEditor(theme: MarketingTheme): boolean {
  return theme !== "novu";
}

export function isAlternateMarketingTheme(theme: MarketingTheme): boolean {
  return theme !== "novu";
}

/** Modifier on `.about-us` so `/about` and `#about` inherit the brand marketing theme. */
export function aboutUsThemeClass(theme: MarketingTheme | undefined): string {
  if (theme === "spark-academy") return "about-us--spark-academy";
  if (theme === "abacus-classic") return "about-us--abacus-classic";
  if (theme === "edu-learn") return "about-us--edu-learn";
  return "about-us--novu";
}
