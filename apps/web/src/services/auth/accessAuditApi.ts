import type { PortalType, TenantContext } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";

export type AccessAuditAction = "export" | "view_pii" | "credentials" | "handoff";

export type ReportAccessAuditInput = {
  action: AccessAuditAction;
  resourceType: string;
  resourceId?: string | null;
  tenant: Pick<TenantContext, "portalType" | "brandId" | "centerId">;
  path?: string | null;
  metadata?: Record<string, unknown>;
};

const SENSITIVE_META_KEYS = new Set([
  "password",
  "access_token",
  "refresh_token",
  "apikey",
  "token",
  "Authorization",
]);

export function sanitizeAccessAuditMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta) return out;
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_META_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

/** Best-effort sensitive-access audit. Never throws. */
export async function reportAccessAudit(input: ReportAccessAuditInput): Promise<void> {
  try {
    const resourceType = input.resourceType.trim().slice(0, 80);
    if (!resourceType) return;
    const { error } = await getSupabase().rpc("log_access_audit_event", {
      p_action: input.action,
      p_resource_type: resourceType,
      p_resource_id: input.resourceId ?? null,
      p_portal: input.tenant.portalType as PortalType,
      p_brand_id: input.tenant.brandId,
      p_center_id: input.tenant.centerId,
      p_path: input.path?.slice(0, 300) ?? null,
      p_user_agent: typeof navigator === "undefined" ? null : navigator.userAgent.slice(0, 512),
      p_metadata: sanitizeAccessAuditMetadata(input.metadata),
    });
    if (error) console.warn("access audit log failed", error.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("access audit log failed", message);
  }
}
