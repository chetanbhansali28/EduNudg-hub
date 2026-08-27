import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  applyAuditDirectoryNames,
  mapAuthAuditToPlatformLog,
  type AuthAuditRow,
  type PlatformAuditLog,
} from "@/lib/platformAuditHelpers";

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

const POSTGREST_PAGE = 1000;
/** Newest rows per table (two PostgREST pages). Combined cap is 4000. */
export const AUDIT_FETCH_MAX_PER_TABLE = 2000;

async function fetchNewestRows<T>(table: string, max: number): Promise<T[]> {
  const supabase = getSupabase();
  const acc: T[] = [];
  for (let from = 0; from < max; from += POSTGREST_PAGE) {
    const to = Math.min(from + POSTGREST_PAGE - 1, max - 1);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    const rows = supabaseList(data as T[] | null, error);
    acc.push(...rows);
    if (rows.length < to - from + 1) break;
  }
  return acc;
}

async function fetchAuditDirectoryNames(
  brandIds: string[],
  centerIds: string[]
): Promise<{ brands: Record<string, string>; centers: Record<string, string> }> {
  const supabase = getSupabase();
  const brands: Record<string, string> = {};
  const centers: Record<string, string> = {};

  if (brandIds.length > 0) {
    const { data, error } = await supabase.from("brands").select("id, name").in("id", brandIds);
    for (const row of supabaseList(data as { id: string; name: string | null }[] | null, error)) {
      if (row.name) brands[row.id] = row.name;
    }
  }

  if (centerIds.length > 0) {
    const { data, error } = await supabase
      .from("franchise_centers")
      .select("id, name, display_name")
      .in("id", centerIds);
    for (const row of supabaseList(
      data as { id: string; name: string | null; display_name: string | null }[] | null,
      error
    )) {
      const label = row.display_name?.trim() || row.name?.trim();
      if (label) centers[row.id] = label;
    }
  }

  return { brands, centers };
}

/** Newest mutation + auth audit rows for platform `/admin/audit`. */
export async function fetchPlatformAuditLogs(): Promise<PlatformAuditLog[]> {
  const [mutations, auth] = await Promise.all([
    fetchNewestRows<PlatformAuditLog>("platform_audit_logs", AUDIT_FETCH_MAX_PER_TABLE),
    fetchNewestRows<AuthAuditRow>("auth_audit_logs", AUDIT_FETCH_MAX_PER_TABLE),
  ]);
  const mutationRows = mutations.map((row) => ({ ...row, source: "mutation" as const }));
  const authRows = auth.map(mapAuthAuditToPlatformLog);
  const merged = [...mutationRows, ...authRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const brandIds = [...new Set(merged.map((row) => row.brand_id).filter((id): id is string => Boolean(id)))];
  const centerIds = [...new Set(merged.map((row) => row.center_id).filter((id): id is string => Boolean(id)))];
  const names = await fetchAuditDirectoryNames(brandIds, centerIds);
  return applyAuditDirectoryNames(merged, names);
}
