import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Database = Record<string, unknown>;

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey);
}

export { createClient, type SupabaseClient };
