import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { E2E_USERS, hasE2EBackend, loadE2EEnv } from "./env";

type Persona = keyof typeof E2E_USERS;

/**
 * Authenticated Supabase JS client for E2E cleanup RPCs when DATABASE_URL is unset.
 * Uses the public anon key + seed persona password (never service_role).
 */
export async function withE2ESupabaseUser<T>(
  persona: Persona,
  fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  loadE2EEnv();
  if (!hasE2EBackend()) {
    throw new Error("VITE_SUPABASE_URL + anon key required for E2E Supabase RPC helpers");
  }
  const url = process.env.VITE_SUPABASE_URL!.trim();
  const key = process.env.VITE_SUPABASE_ANON_KEY!.trim();
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const user = E2E_USERS[persona];
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) {
    throw new Error(`E2E ${persona} sign-in failed: ${error.message}`);
  }
  try {
    return await fn(client);
  } finally {
    await client.auth.signOut().catch(() => undefined);
  }
}
