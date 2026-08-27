import type { Session } from "@supabase/supabase-js";
import type { PortalType, TenantContext } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";
import { authSessionAuditId } from "./authSessionAuditId";

export type AuthAuditEventType = "login_success" | "login_failure" | "logout" | "access_denied";

export type AuthAuditProvider = "google" | "facebook" | "whatsapp" | "passkey" | "email" | "magic_link";

export type ReportAuthAuditInput = {
  eventType: AuthAuditEventType;
  tenant: Pick<TenantContext, "portalType" | "brandId" | "centerId" | "hostname">;
  session?: Session | null;
  provider?: AuthAuditProvider | null;
  identifier?: string | null;
  metadata?: Record<string, unknown>;
};

const SENSITIVE_META_KEYS = new Set(["password", "access_token", "refresh_token", "apikey", "token", "Authorization"]);

export function sanitizeAuthAuditMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta) return out;
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_META_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function providerFromSession(session: Session | null | undefined): AuthAuditProvider | null {
  const raw =
    (typeof session?.user.app_metadata?.provider === "string" && session.user.app_metadata.provider) ||
    session?.user.identities?.[0]?.provider ||
    "";
  const normalized = raw.toLowerCase();
  if (
    normalized === "google" ||
    normalized === "facebook" ||
    normalized === "whatsapp" ||
    normalized === "passkey" ||
    normalized === "email" ||
    normalized === "magic_link"
  ) {
    return normalized;
  }
  if (normalized === "phone") return "whatsapp";
  return session ? "email" : null;
}

function rpcArgs(input: ReportAuthAuditInput) {
  const session = input.session ?? null;
  const userId = session?.user.id ?? "";
  const metadata = sanitizeAuthAuditMetadata({
    ...input.metadata,
    hostname: input.tenant.hostname,
    email: session?.user.email ?? input.metadata?.email,
  });
  return {
    p_event_type: input.eventType,
    p_provider: input.provider ?? providerFromSession(session),
    p_session_id: session ? authSessionAuditId(session.access_token, userId) : null,
    p_portal: input.tenant.portalType as PortalType,
    p_brand_id: input.tenant.brandId,
    p_center_id: input.tenant.centerId,
    p_user_agent: typeof navigator === "undefined" ? null : navigator.userAgent.slice(0, 512),
    p_metadata: metadata,
    p_identifier: input.identifier?.trim().toLowerCase() || null,
  };
}

/** Best-effort auth audit. Never throws. */
export async function reportAuthAudit(input: ReportAuthAuditInput): Promise<void> {
  try {
    const supabase = getSupabase();
    const args = rpcArgs(input);
    const invokeBody = {
      eventType: args.p_event_type,
      provider: args.p_provider,
      sessionId: args.p_session_id,
      portal: args.p_portal,
      brandId: args.p_brand_id,
      centerId: args.p_center_id,
      userAgent: args.p_user_agent,
      metadata: args.p_metadata,
      identifier: args.p_identifier,
    };
    const { error: invokeError } = await supabase.functions.invoke("auth-audit", { body: invokeBody });
    if (!invokeError) return;
    const { error: rpcError } = await supabase.rpc("log_auth_audit_event", args);
    if (rpcError) {
      console.warn("auth audit log failed", rpcError.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("auth audit log failed", message);
  }
}
