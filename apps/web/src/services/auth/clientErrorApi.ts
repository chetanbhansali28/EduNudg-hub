import type { PortalType, TenantContext } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";

const SENSITIVE_META_KEYS = new Set([
  "password",
  "access_token",
  "refresh_token",
  "apikey",
  "token",
  "Authorization",
]);

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

export type ReportClientErrorInput = {
  message: string;
  stack?: string | null;
  route?: string | null;
  tenant: Pick<TenantContext, "portalType" | "brandId" | "centerId">;
  metadata?: Record<string, unknown>;
};

export function sanitizeClientErrorText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const stripped = value.replace(JWT_LIKE, "[redacted]").slice(0, max).trim();
  return stripped || null;
}

export function sanitizeClientErrorMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta) return out;
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_META_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/** Best-effort fatal client error report. Never throws. */
export async function reportClientError(input: ReportClientErrorInput): Promise<void> {
  try {
    const message = sanitizeClientErrorText(input.message, 500);
    if (!message) return;
    const { error } = await getSupabase().rpc("log_client_error_event", {
      p_message: message,
      p_stack: sanitizeClientErrorText(input.stack, 4000),
      p_route: sanitizeClientErrorText(input.route, 300),
      p_portal: input.tenant.portalType as PortalType,
      p_brand_id: input.tenant.brandId,
      p_center_id: input.tenant.centerId,
      p_user_agent: typeof navigator === "undefined" ? null : navigator.userAgent.slice(0, 512),
      p_metadata: sanitizeClientErrorMetadata(input.metadata),
    });
    if (error) console.warn("client error report failed", error.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("client error report failed", message);
  }
}
