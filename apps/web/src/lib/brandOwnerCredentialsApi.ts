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

/** True when the admin intentionally edited login email or password (ignores autofill on theme-only saves). */
export function shouldSyncBrandOwnerCredentials(input: {
  loginEmail: string;
  password: string;
  originalLoginEmail: string | null;
  credentialsLoaded: boolean;
  loginFieldsTouched: boolean;
}): boolean {
  if (!input.credentialsLoaded || !input.loginFieldsTouched) return false;
  const email = input.loginEmail.trim();
  if (!email) return false;
  const original = (input.originalLoginEmail ?? "").trim().toLowerCase();
  const emailChanged = email.toLowerCase() !== original;
  const passwordEntered = Boolean(input.password.trim());
  return emailChanged || passwordEntered;
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
