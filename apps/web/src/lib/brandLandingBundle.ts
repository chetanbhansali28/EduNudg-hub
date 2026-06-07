import type { HomepageConfig } from "@/types/homepage";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { parsePublicCurriculum } from "@/lib/brandCurriculumPublic";
import type { MarketingTheme } from "@/types/homepage";
import { parseMarketingTheme } from "@/types/homepage";

export type BrandPublicStats = {
  centersCount: number;
  studentsCount: number;
};

export type BrandLandingBundle = {
  config: HomepageConfig;
  publicCurriculum: PublicCurriculumProgram[];
  marketingTheme: MarketingTheme;
  publicStats: BrandPublicStats;
};

function isHomepageConfig(value: unknown): value is HomepageConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "hero" in value &&
    typeof (value as HomepageConfig).hero === "object" &&
    (value as HomepageConfig).hero !== null
  );
}

function parsePublicStats(raw: unknown): BrandPublicStats {
  if (typeof raw !== "object" || raw === null) {
    return { centersCount: 0, studentsCount: 0 };
  }
  const row = raw as Record<string, unknown>;
  const centersCount =
    typeof row.centersCount === "number"
      ? row.centersCount
      : typeof row.centers_count === "number"
        ? row.centers_count
        : 0;
  const studentsCount =
    typeof row.studentsCount === "number"
      ? row.studentsCount
      : typeof row.students_count === "number"
        ? row.students_count
        : 0;
  return { centersCount, studentsCount };
}

/** Normalizes React Query cache entries (legacy bare config or bundle). */
export function normalizeBrandLandingBundle(data: unknown): BrandLandingBundle | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  if (record.config !== undefined) {
    if (!isHomepageConfig(record.config)) return null;
    const curriculum = Array.isArray(record.publicCurriculum)
      ? parsePublicCurriculum(record.publicCurriculum)
      : [];
    return {
      config: record.config,
      publicCurriculum: curriculum,
      marketingTheme: parseMarketingTheme(record.marketingTheme),
      publicStats: parsePublicStats(record.publicStats),
    };
  }

  if (isHomepageConfig(data)) {
    return {
      config: data,
      publicCurriculum: [],
      marketingTheme: "novu",
      publicStats: { centersCount: 0, studentsCount: 0 },
    };
  }

  return null;
}

export function isBrandLandingBundleReady(bundle: BrandLandingBundle | null | undefined): bundle is BrandLandingBundle {
  return !!bundle && isHomepageConfig(bundle.config);
}
