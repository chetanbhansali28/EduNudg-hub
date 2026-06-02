import { createSupabaseClient, type SupabaseClient } from "@edunudg/database";

let supabase: SupabaseClient | null = null;

const PLACEHOLDER_URL_RE =
  /your_project_ref|YOUR_PROJECT_REF|xyzcompany|example\.supabase/i;
const PLACEHOLDER_KEY_RE = /^your-anon|^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eXample/i;

function assertSupabaseEnv(url: string, key: string): void {
  if (PLACEHOLDER_URL_RE.test(url)) {
    throw new Error(
      "VITE_SUPABASE_URL is still a placeholder in apps/web/.env. Set it to your Project URL from Supabase Dashboard → Settings → API (see docs/ops/supabase-cloud-setup.md)."
    );
  }
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error(
      "VITE_SUPABASE_URL must be your Supabase Cloud HTTPS URL (e.g. https://<ref>.supabase.co)."
    );
  }
  if (!key || PLACEHOLDER_KEY_RE.test(key)) {
    throw new Error(
      "VITE_SUPABASE_ANON_KEY is missing or still a placeholder in apps/web/.env. Use the anon public key from Supabase Dashboard → Settings → API."
    );
  }
}

export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in apps/web/.env — use your Supabase Cloud project (see docs/ops/supabase-cloud-setup.md)"
    );
  }
  assertSupabaseEnv(url, key);
  supabase = createSupabaseClient(url, key);
  return supabase;
}
