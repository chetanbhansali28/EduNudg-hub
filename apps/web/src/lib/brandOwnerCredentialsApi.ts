import { getSupabase } from "@/lib/supabase";

export async function fetchBrandOwnerLoginEmail(brandId: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("get_brand_owner_login", {
    p_brand_id: brandId,
  });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

export interface UpsertBrandOwnerCredentialsInput {
  brandId: string;
  email: string;
  password?: string;
  fullName?: string;
}

export async function upsertBrandOwnerCredentials(
  input: UpsertBrandOwnerCredentialsInput
): Promise<{ error: string | null }> {
  const email = input.email.trim();
  if (!email) {
    return { error: "Login email is required" };
  }

  const { data, error } = await getSupabase().functions.invoke("brand-owner-credentials", {
    body: {
      brandId: input.brandId,
      email,
      password: input.password?.trim() || undefined,
      fullName: input.fullName?.trim() || undefined,
    },
  });

  if (error) return { error: error.message };

  const payload = data as { error?: string; ok?: boolean } | null;
  if (payload?.error) return { error: payload.error };
  if (!payload?.ok) return { error: "Failed to save brand login credentials" };

  return { error: null };
}
