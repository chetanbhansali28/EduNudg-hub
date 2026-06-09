import type { MarketingTheme } from "@/types/homepage";

/** CSS modifier class per marketing theme (null = default Novu). */
export const MARKETING_PAGE_MODIFIER: Record<MarketingTheme, string | null> = {
  novu: null,
  "abacus-classic": "marketing-page--abacus-classic",
  "spark-academy": "marketing-page--spark-academy",
};

export function marketingPageClassName(theme: MarketingTheme): string {
  const modifier = MARKETING_PAGE_MODIFIER[theme];
  return modifier ? `marketing-page ${modifier}` : "marketing-page";
}

export function themeUsesLeadModals(theme: MarketingTheme): boolean {
  return theme === "abacus-classic" || theme === "spark-academy";
}

export function isAlternateMarketingTheme(theme: MarketingTheme): boolean {
  return theme !== "novu";
}
