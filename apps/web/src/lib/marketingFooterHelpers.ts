import type { HomepageConfig, HomepageRichFooter } from "@/types/homepage";
import type { BrandLegalPages, BrandLegalPageKind } from "@/lib/brandLegalPages";
import { BRAND_LEGAL_PAGE_KINDS, BRAND_LEGAL_PAGE_LABELS, hasBrandLegalPage } from "@/lib/brandLegalPages";

export type FooterStatItem = { value: string; label: string };

export type FooterLegalLink = {
  kind: BrandLegalPageKind;
  label: string;
  href: string;
};

const CONFIGURED_HREF_KEYS: Record<BrandLegalPageKind, "privacyHref" | "termsHref" | "refundHref"> = {
  privacy: "privacyHref",
  terms: "termsHref",
  refund: "refundHref",
};

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
  kind: BrandLegalPageKind,
  config: HomepageConfig,
  legalPages: BrandLegalPages
): string | null {
  if (hasBrandLegalPage(legalPages, kind)) {
    return `/legal/${kind}`;
  }

  const configured = config.footer[CONFIGURED_HREF_KEYS[kind]]?.trim();
  return configured || null;
}

export function buildFooterLegalLinks(config: HomepageConfig, legalPages: BrandLegalPages): FooterLegalLink[] {
  return BRAND_LEGAL_PAGE_KINDS.flatMap((kind) => {
    const href = resolveFooterLegalHref(kind, config, legalPages);
    if (!href) return [];
    return [{ kind, label: BRAND_LEGAL_PAGE_LABELS[kind], href }];
  });
}
