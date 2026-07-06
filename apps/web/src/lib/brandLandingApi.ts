import { getSupabase } from "@/lib/supabase";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig, mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { parseBrandLegalPages, parseBrandLegalPagesRecord } from "@/lib/brandLegalPages";
import { parsePublicCurriculum, type PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { parsePublicSuccessStories } from "@/lib/brandSuccessStoriesPublic";
import { mergePublishedSuccessStories } from "@/lib/mergeBrandTestimonials";
import type { BrandLandingBundle, BrandPublicStats } from "@/lib/brandLandingBundle";
import { applyCanonicalSiteName, syncMarketingNavLinks } from "@/lib/marketingPublicSite";
import type { MarketingTheme, HomepageConfig } from "@/types/homepage";
import { MARKETING_THEMES, parseMarketingTheme } from "@/types/homepage";

export type { PublicCurriculumProgram, BrandLandingBundle, BrandPublicStats };

type BrandLandingRow = {
  brand_id?: string;
  brand_slug?: string;
  brand_name?: string;
  brand_logo_url?: string | null;
  marketing_theme?: string;
  public_stats?: unknown;
  landing?: Partial<HomepageConfig>;
  success_stories?: unknown;
  curriculum?: unknown;
  legal_pages?: unknown;
};

function parsePublicStats(raw: unknown): BrandPublicStats {
  if (typeof raw !== "object" || raw === null) {
    return { centersCount: 0, studentsCount: 0 };
  }
  const row = raw as Record<string, unknown>;
  return {
    centersCount: typeof row.centers_count === "number" ? row.centers_count : 0,
    studentsCount: typeof row.students_count === "number" ? row.students_count : 0,
  };
}

function buildConfigForTheme(
  theme: MarketingTheme,
  brandName: string,
  partial: Partial<HomepageConfig> | undefined,
  logoUrl: string | null | undefined
): HomepageConfig {
  if (theme === "abacus-classic") {
    return mergeAbacusClassicLandingConfig(brandName, partial, logoUrl);
  }
  if (theme === "spark-academy") {
    return mergeSparkAcademyLandingConfig(brandName, partial, logoUrl);
  }
  return buildBrandLandingConfig(brandName, partial, logoUrl);
}

function buildBundle(
  brandName: string,
  row: BrandLandingRow | null,
  stories: ReturnType<typeof parsePublicSuccessStories>,
  curriculum: PublicCurriculumProgram[],
  theme: MarketingTheme,
  publicStats: BrandPublicStats,
  legalPages = parseBrandLegalPages(undefined)
): BrandLandingBundle {
  const canonicalName = row?.brand_name ?? brandName;
  const config = buildConfigForTheme(theme, canonicalName, row?.landing ?? undefined, row?.brand_logo_url ?? null);
  const merged = applyCanonicalSiteName(
    {
      ...config,
      testimonials: mergePublishedSuccessStories(config.testimonials, stories),
    },
    canonicalName
  );
  return {
    config: syncMarketingNavLinks(merged, { theme, publicCurriculum: curriculum }),
    publicCurriculum: curriculum,
    marketingTheme: theme,
    publicStats,
    legalPages,
  };
}

function fallbackBundle(
  fallbackName: string,
  stories: ReturnType<typeof parsePublicSuccessStories>,
  curriculum: PublicCurriculumProgram[],
  theme: MarketingTheme = "novu",
  publicStats: BrandPublicStats = { centersCount: 0, studentsCount: 0 },
  legalPages = parseBrandLegalPages(undefined)
): BrandLandingBundle {
  const config = buildConfigForTheme(theme, fallbackName, undefined, undefined);
  const merged = applyCanonicalSiteName(
    {
      ...config,
      testimonials: mergePublishedSuccessStories(config.testimonials, stories),
    },
    fallbackName
  );
  return {
    config: syncMarketingNavLinks(merged, { theme, publicCurriculum: curriculum }),
    publicCurriculum: curriculum,
    marketingTheme: theme,
    publicStats,
    legalPages,
  };
}

export async function fetchBrandLandingBundle(brandSlug: string): Promise<BrandLandingBundle | null> {
  if (!brandSlug) return null;

  const fallbackName = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const { data, error } = await getSupabase().rpc("get_brand_landing_public", { p_brand_slug: brandSlug });
    const stories = parsePublicSuccessStories(
      data && typeof data === "object" ? (data as BrandLandingRow).success_stories : undefined
    );
    const curriculum = parsePublicCurriculum(
      data && typeof data === "object" ? (data as BrandLandingRow).curriculum : undefined
    );

    if (error || !data || typeof data !== "object") {
      return fallbackBundle(fallbackName, stories, curriculum);
    }

    const row = data as BrandLandingRow;
    const theme = parseMarketingTheme(row.marketing_theme);
    const publicStats = parsePublicStats(row.public_stats);
    const legalPages =
      row.legal_pages && typeof row.legal_pages === "object"
        ? parseBrandLegalPagesRecord(row.legal_pages as Record<string, unknown>)
        : parseBrandLegalPages(undefined);

    if (!row.brand_name) {
      return fallbackBundle(fallbackName, stories, curriculum, theme, publicStats, legalPages);
    }

    return buildBundle(fallbackName, row, stories, curriculum, theme, publicStats, legalPages);
  } catch {
    const config = buildBrandLandingConfig(fallbackName);
    return {
      config: syncMarketingNavLinks(applyCanonicalSiteName(config, fallbackName), {
        theme: "novu",
        publicCurriculum: [],
      }),
      publicCurriculum: [],
      marketingTheme: "novu",
      publicStats: { centersCount: 0, studentsCount: 0 },
      legalPages: {},
    };
  }
}

/** @deprecated Use fetchBrandLandingBundle */
export async function fetchBrandLandingConfig(brandSlug: string): Promise<HomepageConfig | null> {
  const bundle = await fetchBrandLandingBundle(brandSlug);
  return bundle?.config ?? null;
}

export async function updateBrandMarketingTheme(brandId: string, theme: MarketingTheme): Promise<void> {
  if (!MARKETING_THEMES.includes(theme)) {
    throw new Error("Invalid marketing theme");
  }

  const { data: rpcTheme, error: rpcError } = await getSupabase().rpc("set_brand_marketing_theme", {
    p_brand_id: brandId,
    p_theme: theme,
  });

  if (!rpcError && typeof rpcTheme === "string") {
    if (parseMarketingTheme(rpcTheme) !== theme) {
      throw new Error("Marketing theme was not saved correctly");
    }
    return;
  }

  // Fallback for environments that have not applied migration 041 yet.
  if (rpcError && !rpcError.message.includes("Could not find the function")) {
    throw new Error(formatMarketingThemeUpdateError(rpcError.message));
  }

  const { data, error } = await getSupabase()
    .from("brands")
    .update({ marketing_theme: theme })
    .eq("id", brandId)
    .select("marketing_theme")
    .maybeSingle();

  if (error) throw new Error(formatMarketingThemeUpdateError(error.message));
  if (!data) {
    throw new Error("Brand not found or you do not have permission to update its marketing theme");
  }
  if (parseMarketingTheme(data.marketing_theme) !== theme) {
    throw new Error("Marketing theme was not saved correctly");
  }
}

function formatMarketingThemeUpdateError(message: string): string {
  if (message.includes("brands_marketing_theme_check")) {
    return "Spark Academy requires the latest database migration. Ask your platform admin to run: supabase db push";
  }
  return message;
}

export type FranchiseInquiryInput = {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  message?: string;
  proposedFranchiseName?: string;
  addressLine?: string;
  state?: string;
  pincode?: string;
  priorExperience?: string;
};

export async function submitFranchiseInquiry(
  brandSlug: string,
  input: FranchiseInquiryInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    const { data, error } = await getSupabase().rpc("submit_franchise_inquiry_v2", {
      p_brand_slug: brandSlug,
      p_full_name: input.fullName.trim(),
      p_email: input.email.trim(),
      p_phone_e164: input.phone?.trim() || null,
      p_city: input.city?.trim() || null,
      p_message: input.message?.trim() || null,
      p_proposed_franchise_name: input.proposedFranchiseName?.trim() || null,
      p_address_line: input.addressLine?.trim() || null,
      p_state: input.state?.trim() || null,
      p_pincode: input.pincode?.trim() || null,
      p_prior_experience: input.priorExperience?.trim() || null,
    });
    if (error) return { id: null, error: error.message };
    return { id: data as string, error: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : "Submission failed" };
  }
}
