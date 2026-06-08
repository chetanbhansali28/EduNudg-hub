import { getSupabase } from "@/lib/supabase";
import type { PortalTarget } from "@/lib/brandPortalUrl";
import { portalBackendUrl, portalHandoffLoginUrl } from "@/lib/brandPortalUrl";

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

/** Open brand/center/learn/parents backend as the signed-in platform admin (new tab). */
export async function openPortalAsPlatformAdmin(target: PortalTarget): Promise<void> {
  const redirectTo = portalHandoffLoginUrl(target);
  const { url, error } = await requestPlatformPortalHandoff(redirectTo);
  if (error || !url) {
    throw new Error(error ?? "Could not open portal as platform admin");
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openPortalBackendFallback(target: PortalTarget): void {
  window.open(portalBackendUrl(target), "_blank", "noopener,noreferrer");
}
