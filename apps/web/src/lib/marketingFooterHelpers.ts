import type { HomepageConfig, HomepageRichFooter } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { hasBrandLegalPage } from "@/lib/brandLegalPages";

export type FooterStatItem = { value: string; label: string };

export function buildBrandFooterStats(rich: HomepageRichFooter | undefined): FooterStatItem[] {
  const stats: FooterStatItem[] = [];
  const brandStats = rich?.brandStats;

  const franchise = brandStats?.franchiseCount?.trim();
  if (franchise) {
    stats.push({ value: franchise, label: "Franchises" });
  }

  const students = brandStats?.studentCount?.trim();
  if (students) {
    stats.push({ value: students, label: "Students" });
  }

  for (const custom of rich?.customStats ?? []) {
    if (custom.value.trim() && custom.label.trim()) {
      stats.push({ value: custom.value.trim(), label: custom.label.trim() });
    }
  }

  return stats;
}

export function parsePresenceCitiesInput(value: string): string[] {
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

export function formatPresenceCitiesInput(cities: string[]): string {
  return cities.join(", ");
}

export function resolveFooterLegalHref(
  kind: "privacy" | "terms",
  _config: HomepageConfig,
  legalPages: BrandLegalPages
): string | null {
  if (!hasBrandLegalPage(legalPages, kind)) return null;
  return kind === "privacy" ? "/legal/privacy" : "/legal/terms";
}
