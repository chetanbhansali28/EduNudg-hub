import type { HomepageConfig } from "@/types/homepage";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { parsePublicCurriculum } from "@/lib/brandCurriculumPublic";

export type BrandLandingBundle = {
  config: HomepageConfig;
  publicCurriculum: PublicCurriculumProgram[];
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

/** Normalizes React Query cache entries (legacy bare config or bundle). */
export function normalizeBrandLandingBundle(data: unknown): BrandLandingBundle | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  if (record.config !== undefined) {
    if (!isHomepageConfig(record.config)) return null;
    const curriculum = Array.isArray(record.publicCurriculum)
      ? parsePublicCurriculum(record.publicCurriculum)
      : [];
    return { config: record.config, publicCurriculum: curriculum };
  }

  if (isHomepageConfig(data)) {
    return { config: data, publicCurriculum: [] };
  }

  return null;
}

export function isBrandLandingBundleReady(bundle: BrandLandingBundle | null | undefined): bundle is BrandLandingBundle {
  return !!bundle && isHomepageConfig(bundle.config);
}
