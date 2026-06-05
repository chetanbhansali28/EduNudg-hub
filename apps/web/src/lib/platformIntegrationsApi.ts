import { getSupabase } from "@/lib/supabase";
import {
  mergePlatformIntegrations,
  type PlatformIntegrationKey,
} from "./platformIntegrations";

export const PLATFORM_INTEGRATIONS_KEY = "integrations";

export async function fetchPlatformIntegrations(): Promise<Record<PlatformIntegrationKey, boolean>> {
  const { data, error } = await getSupabase()
    .from("platform_settings")
    .select("value")
    .eq("key", PLATFORM_INTEGRATIONS_KEY)
    .maybeSingle();
  if (error) throw error;
  const stored = (data?.value ?? {}) as Record<string, boolean>;
  return mergePlatformIntegrations(stored);
}

export async function savePlatformIntegrations(
  integrations: Record<PlatformIntegrationKey, boolean>
): Promise<void> {
  const payload = Object.fromEntries(
    Object.entries(integrations).map(([key, enabled]) => [key, Boolean(enabled)])
  );
  const { data: existing, error: readErr } = await getSupabase()
    .from("platform_settings")
    .select("id")
    .eq("key", PLATFORM_INTEGRATIONS_KEY)
    .maybeSingle();
  if (readErr) throw readErr;

  if (existing?.id) {
    const { error } = await getSupabase()
      .from("platform_settings")
      .update({ value: payload })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await getSupabase().from("platform_settings").insert({
    key: PLATFORM_INTEGRATIONS_KEY,
    value: payload,
  });
  if (error) throw error;
}
