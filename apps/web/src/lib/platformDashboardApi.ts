import { getSupabase } from "@/lib/supabase";
import {
  brandOnboardingMeta,
  brandOnboardingStatus,
  buildPlatformActivityFeed,
  countTrendLabel,
  enterpriseAvatarLabel,
  type PlatformDashboardHome,
  type PlatformEnrollmentPoint,
} from "@/lib/platformDashboardHelpers";

type BrandRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  logo_url: string | null;
  created_at: string;
};

type CenterRow = {
  brand_id: string;
  region: string | null;
};

type EnrollmentRow = {
  created_at: string;
};

type PlanRow = {
  name: string;
};

type BrandSubscriptionRow = {
  brand_id: string;
  subscription_plans: { name: string } | null;
};

type SignupRow = {
  id: string;
  brand_name: string;
  created_at: string;
  status: string;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function quarterKey(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

function quarterLabel(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} '${String(date.getFullYear()).slice(-2)}`;
}

function buildMonthlyPoints(rows: EnrollmentRow[], now = new Date()): PlatformEnrollmentPoint[] {
  const buckets = new Map<string, number>();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.set(monthKey(date), 0);
  }

  for (const row of rows) {
    const date = new Date(row.created_at);
    const key = monthKey(date);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return { key, label: monthLabel(date), value };
  });
}

function buildQuarterlyPoints(rows: EnrollmentRow[], now = new Date()): PlatformEnrollmentPoint[] {
  const buckets = new Map<string, number>();
  for (let index = 3; index >= 0; index -= 1) {
    const month = now.getMonth() - index * 3;
    const date = new Date(now.getFullYear(), month, 1);
    buckets.set(quarterKey(date), 0);
  }

  for (const row of rows) {
    const date = new Date(row.created_at);
    const key = quarterKey(date);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const [yearPart, quarterPart] = key.split("-Q");
    const date = new Date(Number(yearPart), (Number(quarterPart) - 1) * 3, 1);
    return { key, label: quarterLabel(date), value };
  });
}

function countByBrand(centers: CenterRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const center of centers) {
    counts.set(center.brand_id, (counts.get(center.brand_id) ?? 0) + 1);
  }
  return counts;
}

export async function fetchPlatformDashboardHome(now = new Date()): Promise<PlatformDashboardHome> {
  const sb = getSupabase();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    brandsRes,
    centersRes,
    plansRes,
    subscriptionsRes,
    enrollmentsRes,
    signupsRes,
    recentBrandsRes,
    recentSignupsRes,
    activeWeekRes,
    activePriorRes,
    centersWeekRes,
    centersPriorRes,
  ] = await Promise.all([
    sb.from("brands").select("id, slug, name, status, logo_url, created_at").is("deleted_at", null),
    sb.from("franchise_centers").select("brand_id, region").is("deleted_at", null),
    sb.from("subscription_plans").select("name").eq("is_active", true),
    sb.from("brand_subscriptions").select("brand_id, subscription_plans(name)"),
    sb
      .from("student_enrollments")
      .select("created_at")
      .gte("created_at", yearAgo.toISOString())
      .order("created_at", { ascending: true }),
    sb
      .from("platform_brand_signups")
      .select("id, brand_name, created_at, status")
      .eq("status", "converted")
      .gte("created_at", weekAgo.toISOString()),
    sb
      .from("brands")
      .select("id, slug, name, status, logo_url, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    sb
      .from("platform_brand_signups")
      .select("id, brand_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(4),
    sb
      .from("brands")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("created_at", weekAgo.toISOString()),
    sb
      .from("brands")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString()),
    sb
      .from("franchise_centers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", weekAgo.toISOString()),
    sb
      .from("franchise_centers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString()),
  ]);

  const brands = (brandsRes.data ?? []) as BrandRow[];
  const centers = (centersRes.data ?? []) as CenterRow[];
  const plans = (plansRes.data ?? []) as PlanRow[];
  const subscriptions = (subscriptionsRes.data ?? []) as unknown as BrandSubscriptionRow[];
  const enrollments = (enrollmentsRes.data ?? []) as EnrollmentRow[];
  const convertedSignups = (signupsRes.data ?? []) as SignupRow[];
  const recentBrands = (recentBrandsRes.data ?? []) as BrandRow[];
  const recentSignups = (recentSignupsRes.data ?? []) as SignupRow[];

  const activeBrands = brands.filter((brand) => brand.status === "active").length;
  const totalBrands = brands.length;
  const centerCounts = countByBrand(centers);
  const regions = new Set(centers.map((center) => center.region).filter(Boolean));
  const planByBrand = new Map(
    subscriptions.map((row) => [row.brand_id, row.subscription_plans?.name ?? "Standard"])
  );

  const monthlyEnrollments = buildMonthlyPoints(enrollments, now);
  const quarterlyEnrollments = buildQuarterlyPoints(enrollments, now);
  const peakEnrollment = Math.max(...monthlyEnrollments.map((point) => point.value), 0);

  const onboardingRows = recentBrands.slice(0, 4).map((brand) => {
    const status = brandOnboardingStatus(brand.status);
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      planName: planByBrand.get(brand.id) ?? plans[0]?.name ?? "Standard",
      centerCount: centerCounts.get(brand.id) ?? 0,
      status: status.tone,
      statusLabel: status.label,
      meta: brandOnboardingMeta(brand.status, brand.created_at, now.getTime()),
      logoUrl: brand.logo_url,
    };
  });

  const enterpriseAvatars = recentBrands.slice(0, 3).map((brand) => ({
    key: brand.id,
    label: enterpriseAvatarLabel(brand.name),
    imageUrl: brand.logo_url,
  }));

  return {
    activeBrands,
    totalBrands,
    activeBrandsTrend: countTrendLabel(activeWeekRes.count ?? 0, activePriorRes.count ?? 0),
    totalCenters: centers.length,
    centersTrend: countTrendLabel(centersWeekRes.count ?? 0, centersPriorRes.count ?? 0),
    regionCount: regions.size,
    planCount: plans.length,
    planNames: plans.map((plan) => plan.name).join(", ") || "Standard",
    plansTrend: plans.length > 0 ? null : null,
    monthlyEnrollments,
    quarterlyEnrollments,
    peakEnrollment,
    enterpriseLeadsConverted: convertedSignups.length,
    enterpriseAvatars,
    extraEnterpriseCount: Math.max(recentBrands.length - enterpriseAvatars.length, 0),
    onboardingRows,
    activities: buildPlatformActivityFeed(recentBrands, recentSignups, now.getTime()),
  };
}
