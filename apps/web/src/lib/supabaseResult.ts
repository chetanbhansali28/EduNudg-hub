import type { PostgrestError } from "@supabase/supabase-js";

/** List queries: never throw — empty state handles RLS/auth failures without console noise. */
export function supabaseList<T>(data: T[] | null, error: PostgrestError | null): T[] {
  if (error) return [];
  return data ?? [];
}

export function supabaseMaybe<T>(data: T | null, error: PostgrestError | null): T | null {
  if (error) return null;
  return data;
}

/** Dashboard / admin aggregations: fail loudly so React Query can show retry UI. */
export function throwFirstSupabaseError(
  ...results: Array<{ error: PostgrestError | null }>
): void {
  for (const result of results) {
    if (result.error) throw result.error;
  }
}
