import { getSupabase } from "@/lib/supabase";

export interface PlatformBrandSignupInput {
  requestedName: string;
  adminFullName: string;
  email: string;
  city: string;
  phoneE164?: string;
  country?: string;
  message?: string;
}

export async function submitPlatformBrandSignup(
  input: PlatformBrandSignupInput
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("submit_platform_brand_signup", {
    p_requested_name: input.requestedName.trim(),
    p_admin_full_name: input.adminFullName.trim(),
    p_email: input.email.trim(),
    p_city: input.city.trim(),
    p_phone_e164: input.phoneE164?.trim() || null,
    p_country: input.country?.trim() || "IN",
    p_message: input.message?.trim() || null,
  });

  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function approvePlatformBrandSignup(signupId: string): Promise<{ brandId: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("approve_platform_brand_signup", {
    p_signup_id: signupId,
  });
  if (error) return { brandId: null, error: error.message };
  return { brandId: data as string, error: null };
}

export async function rejectPlatformBrandSignup(
  signupId: string,
  reason?: string
): Promise<{ error: string | null }> {
  const { error } = await getSupabase().rpc("reject_platform_brand_signup", {
    p_signup_id: signupId,
    p_reason: reason?.trim() || null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export interface PlatformSignupRow {
  id: string;
  requested_name: string;
  admin_full_name: string;
  email: string;
  phone_e164: string | null;
  city: string;
  country: string | null;
  message: string | null;
  status: string;
  proposed_slug: string | null;
  rejected_reason: string | null;
  created_at: string;
}

export async function listPendingPlatformSignups(): Promise<PlatformSignupRow[]> {
  const { data, error } = await getSupabase()
    .from("platform_brand_signups")
    .select(
      "id, requested_name, admin_full_name, email, phone_e164, city, country, message, status, proposed_slug, rejected_reason, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformSignupRow[];
}
