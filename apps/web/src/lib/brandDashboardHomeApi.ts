import { fetchBrandAnalyticsStats } from "@/lib/brandAnalyticsStats";
import {
  buildBrandActivityFeed,
  buildCenterAvatars,
  buildExpansionGoals,
  buildRevenueBarHeights,
  computeCenterHealthPercent,
  computeRevenueTrendPercent,
  percentChange,
  type BrandDashboardActivity,
  type BrandExpansionGoal,
  type BrandCenterAvatar,
} from "@/lib/brandDashboardHelpers";
import { countStaleBrandLeads } from "@/lib/leadsApi";
import { getSupabase } from "@/lib/supabase";

export type BrandDashboardHome = {
  unassignedLeads: number;
  unassignedLeadsTrend: number | null;
  pendingFranchiseApps: number;
  staleLeads: number;
  revenueTotalCents: number;
  revenueTrendPercent: number | null;
  revenueBars: number[];
  centerHealthPercent: number;
  activeCenters: number;
  pendingCenters: number;
  centerAvatars: BrandCenterAvatar[];
  extraCenterCount: number;
  activities: BrandDashboardActivity[];
  expansionGoals: BrandExpansionGoal[];
};

function isPendingFranchiseStatus(status: string) {
  return status === "new" || status === "contacted" || status === "qualified";
}

function weekBounds(now: Date) {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return {
    weekAgoIso: weekAgo.toISOString(),
    twoWeeksAgoIso: twoWeeksAgo.toISOString(),
  };
}

export async function fetchBrandDashboardHome(brandId: string, now = new Date()): Promise<BrandDashboardHome> {
  const sb = getSupabase();
  const { weekAgoIso, twoWeeksAgoIso } = weekBounds(now);

  const [
    analytics,
    inquiriesRes,
    leadsRes,
    centersRes,
    unassignedRes,
    staleLeads,
    recentUnassignedWeekRes,
    recentUnassignedPriorRes,
    brandSettingsRes,
  ] = await Promise.all([
    fetchBrandAnalyticsStats(brandId),
    sb
      .from("franchise_inquiries")
      .select("id, full_name, proposed_franchise_name, city, state, status, created_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(8),
    sb
      .from("leads")
      .select("id, full_name, child_name, city, status, created_at, updated_at, center_id")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false })
      .limit(8),
    sb
      .from("franchise_centers")
      .select("id, name, status, region, city, updated_at")
      .eq("brand_id", brandId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(12),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .is("center_id", null)
      .not("status", "in", '("converted","lost")'),
    countStaleBrandLeads(brandId),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .is("center_id", null)
      .not("status", "in", '("converted","lost")')
      .gte("created_at", weekAgoIso),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .is("center_id", null)
      .not("status", "in", '("converted","lost")')
      .gte("created_at", twoWeeksAgoIso)
      .lt("created_at", weekAgoIso),
    sb.from("brand_settings").select("settings").eq("brand_id", brandId).maybeSingle(),
  ]);

  const inquiries = inquiriesRes.data ?? [];
  const pendingFranchiseApps = inquiries.filter((row) => isPendingFranchiseStatus(row.status)).length;
  const unassignedLeads = unassignedRes.count ?? 0;
  const unassignedLeadsTrend = percentChange(
    recentUnassignedWeekRes.count ?? 0,
    recentUnassignedPriorRes.count ?? 0
  );

  const centers = centersRes.data ?? [];
  const activeCenters = centers.filter((row) => row.status === "active").length;
  const pendingCenters = centers.filter((row) => row.status !== "active").length;
  const maxCenters =
    (brandSettingsRes.data?.settings as { features?: { max_franchise_centers?: number | null } } | null)?.features
      ?.max_franchise_centers ?? null;

  const { avatars, extraCount } = buildCenterAvatars(
    analytics.topCenters.length > 0
      ? analytics.topCenters.map((center) => ({ name: center.name }))
      : centers.filter((row) => row.status === "active").map((row) => ({ name: row.name }))
  );

  return {
    unassignedLeads,
    unassignedLeadsTrend,
    pendingFranchiseApps,
    staleLeads,
    revenueTotalCents: analytics.revenue30dCents,
    revenueTrendPercent: computeRevenueTrendPercent(analytics.recentDaily),
    revenueBars: buildRevenueBarHeights(analytics.recentDaily),
    centerHealthPercent: computeCenterHealthPercent(activeCenters, centers.length),
    activeCenters,
    pendingCenters,
    centerAvatars: avatars,
    extraCenterCount: extraCount,
    activities: buildBrandActivityFeed({
      inquiries,
      leads: (leadsRes.data ?? []).filter((row) => row.center_id == null),
      centers: centers.filter((row) => row.status === "active").slice(0, 3),
      staleLeads,
      nowMs: now.getTime(),
    }),
    expansionGoals: buildExpansionGoals(centers, maxCenters),
  };
}
