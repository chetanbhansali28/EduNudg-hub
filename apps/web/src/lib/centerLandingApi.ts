import { getSupabase } from "@/lib/supabase";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import type { HomepageConfig } from "@/types/homepage";

type CenterLandingRow = {
  brand_slug?: string;
  brand_name?: string;
  brand_logo_url?: string | null;
  center_slug?: string;
  center_name?: string;
  center_city?: string | null;
  landing?: Partial<HomepageConfig>;
};

export async function fetchCenterLandingConfig(
  brandSlug: string,
  centerSlug: string
): Promise<HomepageConfig | null> {
  if (!brandSlug || !centerSlug) return null;

  const fallbackCenter = centerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const fallbackBrand = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const { data, error } = await getSupabase().rpc("get_center_landing_public", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    if (error || !data || typeof data !== "object") {
      return buildCenterLandingConfig(fallbackCenter, fallbackBrand, null);
    }

    const row = data as CenterLandingRow;
    if (!row.center_name || !row.brand_name) {
      return buildCenterLandingConfig(fallbackCenter, fallbackBrand, null);
    }

    return buildCenterLandingConfig(
      row.center_name,
      row.brand_name,
      row.center_city ?? null,
      row.landing ?? undefined,
      row.brand_logo_url ?? null
    );
  } catch {
    return buildCenterLandingConfig(fallbackCenter, fallbackBrand, null);
  }
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
