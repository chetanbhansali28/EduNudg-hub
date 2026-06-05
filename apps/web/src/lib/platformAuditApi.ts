import { getSupabase } from "@/lib/supabase";

export type PlatformAuditEntry = {
  action: string;
  resource_type: string;
  resource_id?: string | null;
  brand_id?: string | null;
  center_id?: string | null;
  payload?: Record<string, unknown>;
};

/** Append a platform audit event (platform admins only; RLS enforced). */
export async function logPlatformAudit(entry: PlatformAuditEntry): Promise<void> {
  const { data: sessionData } = await getSupabase().auth.getSession();
  const actorId = sessionData.session?.user?.id;
  if (!actorId) return;

  const { error } = await getSupabase().from("platform_audit_logs").insert({
    actor_id: actorId,
    action: entry.action,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id ?? null,
    brand_id: entry.brand_id ?? null,
    center_id: entry.center_id ?? null,
    payload: entry.payload ?? {},
    created_by: actorId,
  });

  if (error) {
    console.warn("platform audit log failed", error.message);
  }
}
