import { getSupabase } from "@/lib/supabase";
import type { PortalTarget } from "@/lib/brandPortalUrl";
import {
  portalBackendPath,
  portalBackendUrl,
  portalHandoffLoginUrl,
  usesSameOriginPortals,
} from "@/lib/brandPortalUrl";
import { portalOverrideSearchParams } from "@/lib/portalOverride";

type HandoffResponse = {
  url?: string;
  error?: string;
};

/** Request a magic-link URL so the current platform admin lands signed-in on another portal host. */
export async function requestPlatformPortalHandoff(redirectTo: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await getSupabase().functions.invoke<HandoffResponse>("platform-portal-handoff", {
    body: { redirectTo },
  });

  if (error) {
    return { url: null, error: error.message };
  }
  if (data?.error) {
    return { url: null, error: data.error };
  }
  if (!data?.url) {
    return { url: null, error: "Portal handoff did not return a URL" };
  }
  return { url: data.url, error: null };
}

/**
 * Ensure same-origin portal query params survive even if an older edge function omitted them.
 * Without portal/brand on *.vercel.app, /app falls through platform routes to the homepage.
 */
export function ensureSameOriginHandoffParams(magicUrl: string, target: PortalTarget): string {
  if (!usesSameOriginPortals()) return magicUrl;

  const url = new URL(magicUrl);
  const overrideParams = portalOverrideSearchParams({
    portalType: target.portalType,
    brandSlug: target.brandSlug,
    centerSlug: target.centerSlug,
  });
  for (const [key, value] of overrideParams.entries()) {
    if (!url.searchParams.get(key)) url.searchParams.set(key, value);
  }
  if (!url.searchParams.get("next")) {
    url.searchParams.set("next", portalBackendPath(target));
  }
  return url.toString();
}

/** Open brand/center/learn/parents backend as the signed-in platform admin (new tab). */
export async function openPortalAsPlatformAdmin(target: PortalTarget): Promise<void> {
  const redirectTo = portalHandoffLoginUrl(target);
  const { url, error } = await requestPlatformPortalHandoff(redirectTo);
  if (error || !url) {
    throw new Error(error ?? "Could not open portal as platform admin");
  }
  window.open(ensureSameOriginHandoffParams(url, target), "_blank", "noopener,noreferrer");
}

export function openPortalBackendFallback(target: PortalTarget): void {
  window.open(portalBackendUrl(target), "_blank", "noopener,noreferrer");
}
