import { getSupabase } from "@/lib/supabase";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
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
};

function fallbackProfile(brandSlug: string, centerSlug: string): CenterPublicProfile {
  const fallbackCenter = centerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const fallbackBrand = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

export async function fetchCenterLandingBundle(
  brandSlug: string,
  centerSlug: string
): Promise<CenterLandingBundle | null> {
  if (!brandSlug || !centerSlug) return null;

  const fallbackCenter = centerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const fallbackBrand = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const { data, error } = await getSupabase().rpc("get_center_landing_public", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    if (error || !data || typeof data !== "object") {
      return {
        config: buildCenterLandingConfig(fallbackCenter, fallbackBrand, null),
        profile: fallbackProfile(brandSlug, centerSlug),
      };
    }

    const row = data as CenterLandingRow;
    if (!row.center_name || !row.brand_name) {
      return {
        config: buildCenterLandingConfig(fallbackCenter, fallbackBrand, null),
        profile: fallbackProfile(brandSlug, centerSlug),
      };
    }

    return {
      config: buildCenterLandingConfig(
        row.center_name,
        row.brand_name,
        row.center_city ?? null,
        row.landing ?? undefined,
        row.brand_logo_url ?? null
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
    };
  } catch {
    return {
      config: buildCenterLandingConfig(fallbackCenter, fallbackBrand, null),
      profile: fallbackProfile(brandSlug, centerSlug),
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
