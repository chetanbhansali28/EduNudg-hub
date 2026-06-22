import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { listPendingPlatformSignups } from "@/lib/platformBrandSignupApi";
import type { PlatformBrandRow, PlatformBrandsHome } from "@/lib/platformBrandsHelpers";

function monthBounds(now: Date) {
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    currentStartIso: currentStart.toISOString(),
    priorStartIso: priorStart.toISOString(),
  };
}

function growthPercent(current: number, prior: number): number | null {
  if (prior <= 0) {
    if (current <= 0) return null;
    return 100;
  }
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export async function fetchPlatformBrandsHome(now = new Date()): Promise<PlatformBrandsHome> {
  const sb = getSupabase();
  const { currentStartIso, priorStartIso } = monthBounds(now);

  const [brandsRes, signups, studentsRes, studentsCurrentRes, studentsPriorRes] = await Promise.all([
    sb.from("brands").select("id, slug, name, status, logo_url").is("deleted_at", null).order("name"),
    listPendingPlatformSignups(),
    sb.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null),
    sb
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", currentStartIso),
    sb
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", priorStartIso)
      .lt("created_at", currentStartIso),
  ]);

  const brands = supabaseList(brandsRes.data, brandsRes.error) as PlatformBrandRow[];

  return {
    brands,
    pendingSignups: signups.length,
    totalStudents: studentsRes.count ?? 0,
    monthlyGrowthPercent: growthPercent(studentsCurrentRes.count ?? 0, studentsPriorRes.count ?? 0),
  };
}
