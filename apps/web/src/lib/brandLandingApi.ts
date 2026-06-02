import { getSupabase } from "@/lib/supabase";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import type { HomepageConfig } from "@/types/homepage";

type BrandLandingRow = {
  brand_id?: string;
  brand_slug?: string;
  brand_name?: string;
  brand_logo_url?: string | null;
  landing?: Partial<HomepageConfig>;
};

export async function fetchBrandLandingConfig(brandSlug: string): Promise<HomepageConfig | null> {
  if (!brandSlug) return null;

  const fallbackName = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const { data, error } = await getSupabase().rpc("get_brand_landing_public", {
      p_brand_slug: brandSlug,
    });
    if (error || !data || typeof data !== "object") {
      return buildBrandLandingConfig(fallbackName);
    }

    const row = data as BrandLandingRow;
    if (!row.brand_name) {
      return buildBrandLandingConfig(fallbackName);
    }

    return buildBrandLandingConfig(row.brand_name, row.landing ?? undefined);
  } catch {
    return buildBrandLandingConfig(fallbackName);
  }
}

export type FranchiseInquiryInput = {
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  message?: string;
};

export async function submitFranchiseInquiry(
  brandSlug: string,
  input: FranchiseInquiryInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    const { data, error } = await getSupabase().rpc("submit_franchise_inquiry", {
      p_brand_slug: brandSlug,
      p_full_name: input.fullName.trim(),
      p_email: input.email.trim(),
      p_phone_e164: input.phone?.trim() || null,
      p_city: input.city?.trim() || null,
      p_message: input.message?.trim() || null,
    });
    if (error) return { id: null, error: error.message };
    return { id: data as string, error: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : "Submission failed" };
  }
}
