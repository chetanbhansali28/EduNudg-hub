import { getSupabase } from "@/lib/supabase";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { parsePublicCurriculum, type PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { parsePublicSuccessStories } from "@/lib/brandSuccessStoriesPublic";
import { mergePublishedSuccessStories } from "@/lib/mergeBrandTestimonials";
import { applyCanonicalSiteName, applyCurriculumNavLink } from "@/lib/marketingPublicSite";
import type { HomepageConfig } from "@/types/homepage";

export type CenterPublicProfile = {
  centerId: string;
  centerSlug: string;
  centerName: string;
  displayName: string | null;
  city: string | null;
  pincode: string | null;
  addressLine1: string | null;
  contactPhone: string | null;
  shortDescription: string | null;
  brandName: string;
  brandSlug: string;
};

export type CenterLandingBundle = {
  config: HomepageConfig;
  profile: CenterPublicProfile;
  publicCurriculum: PublicCurriculumProgram[];
};

type CenterLandingRow = {
  brand_slug?: string;
  brand_name?: string;
  brand_logo_url?: string | null;
  center_id?: string;
  center_slug?: string;
  center_name?: string;
  center_display_name?: string | null;
  center_city?: string | null;
  center_pincode?: string | null;
  center_address_line1?: string | null;
  center_contact_phone?: string | null;
  center_short_description?: string | null;
  landing?: Partial<HomepageConfig>;
  success_stories?: unknown;
  curriculum?: unknown;
};

function slugFallbackLabel(slug: string): string {
  return slug.replace(/-/g, " ");
}

function fallbackProfile(brandSlug: string, centerSlug: string): CenterPublicProfile {
  const fallbackCenter = slugFallbackLabel(centerSlug);
  const fallbackBrand = slugFallbackLabel(brandSlug);
  return {
    centerId: "",
    centerSlug,
    centerName: fallbackCenter,
    displayName: null,
    city: null,
    pincode: null,
    addressLine1: null,
    contactPhone: null,
    shortDescription: null,
    brandName: fallbackBrand,
    brandSlug,
  };
}

function applyCanonicalCenterName(
  config: HomepageConfig,
  centerName: string,
  brandName: string
): HomepageConfig {
  const year = new Date().getFullYear();
  return applyCanonicalSiteName(
    {
      ...config,
      footer: {
        ...config.footer,
        copyright: `© ${year} ${centerName}. Part of ${brandName}.`,
      },
    },
    centerName
  );
}

function buildConfigWithStories(
  centerName: string,
  brandName: string,
  city: string | null,
  landing: Partial<HomepageConfig> | undefined,
  logoUrl: string | null,
  stories: ReturnType<typeof parsePublicSuccessStories>,
  curriculumCount: number
): HomepageConfig {
  const config = buildCenterLandingConfig(centerName, brandName, city, landing, logoUrl);
  const merged = applyCanonicalCenterName(
    {
      ...config,
      testimonials: mergePublishedSuccessStories(config.testimonials, stories),
    },
    centerName,
    brandName
  );
  return applyCurriculumNavLink(merged, curriculumCount > 0);
}

export async function fetchCenterLandingBundle(
  brandSlug: string,
  centerSlug: string
): Promise<CenterLandingBundle | null> {
  if (!brandSlug || !centerSlug) return null;

  const fallbackCenter = slugFallbackLabel(centerSlug);
  const fallbackBrand = slugFallbackLabel(brandSlug);

  try {
    const { data, error } = await getSupabase().rpc("get_center_landing_public", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    const stories = parsePublicSuccessStories(
      data && typeof data === "object" ? (data as CenterLandingRow).success_stories : undefined
    );
    const curriculum = parsePublicCurriculum(
      data && typeof data === "object" ? (data as CenterLandingRow).curriculum : undefined
    );

    if (error || !data || typeof data !== "object") {
      return {
        config: buildConfigWithStories(fallbackCenter, fallbackBrand, null, undefined, null, stories, curriculum.length),
        profile: fallbackProfile(brandSlug, centerSlug),
        publicCurriculum: curriculum,
      };
    }

    const row = data as CenterLandingRow;
    if (!row.center_name || !row.brand_name) {
      return {
        config: buildConfigWithStories(fallbackCenter, fallbackBrand, null, undefined, null, stories, curriculum.length),
        profile: fallbackProfile(brandSlug, centerSlug),
        publicCurriculum: curriculum,
      };
    }

    return {
      config: buildConfigWithStories(
        row.center_name,
        row.brand_name,
        row.center_city ?? null,
        row.landing ?? undefined,
        row.brand_logo_url ?? null,
        stories,
        curriculum.length
      ),
      profile: {
        centerId: row.center_id ?? "",
        centerSlug: row.center_slug ?? centerSlug,
        centerName: row.center_name,
        displayName: row.center_display_name ?? null,
        city: row.center_city ?? null,
        pincode: row.center_pincode ?? null,
        addressLine1: row.center_address_line1 ?? null,
        contactPhone: row.center_contact_phone ?? null,
        shortDescription: row.center_short_description ?? null,
        brandName: row.brand_name,
        brandSlug: row.brand_slug ?? brandSlug,
      },
      publicCurriculum: curriculum,
    };
  } catch {
    const config = buildCenterLandingConfig(fallbackCenter, fallbackBrand, null);
    return {
      config: applyCurriculumNavLink(
        applyCanonicalCenterName(config, fallbackCenter, fallbackBrand),
        false
      ),
      profile: fallbackProfile(brandSlug, centerSlug),
      publicCurriculum: [],
    };
  }
}

/** @deprecated Use fetchCenterLandingBundle */
export async function fetchCenterLandingConfig(
  brandSlug: string,
  centerSlug: string
): Promise<HomepageConfig | null> {
  const bundle = await fetchCenterLandingBundle(brandSlug, centerSlug);
  return bundle?.config ?? null;
}

export type CenterEnrollmentLeadInput = {
  parentName: string;
  email: string;
  phone?: string;
  childName?: string;
  childAgeYears?: number;
  notes?: string;
};

export async function submitCenterEnrollmentLead(
  brandSlug: string,
  centerSlug: string,
  input: CenterEnrollmentLeadInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    const { data, error } = await getSupabase().rpc("submit_center_enrollment_lead", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
      p_parent_name: input.parentName.trim(),
      p_email: input.email.trim(),
      p_phone_e164: input.phone?.trim() || null,
      p_child_name: input.childName?.trim() || null,
      p_child_age_years: input.childAgeYears ?? null,
      p_notes: input.notes?.trim() || null,
    });
    if (error) return { id: null, error: error.message };
    return { id: data as string, error: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : "Submission failed" };
  }
}
