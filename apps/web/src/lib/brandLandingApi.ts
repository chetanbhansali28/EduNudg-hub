import { getSupabase } from "@/lib/supabase";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { parsePublicSuccessStories } from "@/lib/brandSuccessStoriesPublic";
import { mergePublishedSuccessStories } from "@/lib/mergeBrandTestimonials";
import type { HomepageConfig } from "@/types/homepage";

type BrandLandingRow = {
  brand_id?: string;
  brand_slug?: string;
  brand_name?: string;
  brand_logo_url?: string | null;
  landing?: Partial<HomepageConfig>;
  success_stories?: unknown;
};

export async function fetchBrandLandingConfig(brandSlug: string): Promise<HomepageConfig | null> {
  if (!brandSlug) return null;

  const fallbackName = brandSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    const { data, error } = await getSupabase().rpc("get_brand_landing_public", { p_brand_slug: brandSlug });
    const stories = parsePublicSuccessStories(
      data && typeof data === "object" ? (data as BrandLandingRow).success_stories : undefined
    );

    if (error || !data || typeof data !== "object") {
      const config = buildBrandLandingConfig(fallbackName);
      return {
        ...config,
        testimonials: mergePublishedSuccessStories(config.testimonials, stories),
      };
    }

    const row = data as BrandLandingRow;
    if (!row.brand_name) {
      const config = buildBrandLandingConfig(fallbackName);
      return {
        ...config,
        testimonials: mergePublishedSuccessStories(config.testimonials, stories),
      };
    }

    const config = buildBrandLandingConfig(row.brand_name, row.landing ?? undefined, row.brand_logo_url ?? null);
    return {
      ...config,
      testimonials: mergePublishedSuccessStories(config.testimonials, stories),
    };
  } catch {
    const config = buildBrandLandingConfig(fallbackName);
    return config;
  }
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
