import { formatCompactRelative } from "@/lib/brandDashboardHelpers";
import { initialsFromName } from "@/lib/welcomeMessage";

export type PlatformDashboardActivityKind = "brand" | "billing" | "security" | "signup";

export type PlatformDashboardActivity = {
  id: string;
  kind: PlatformDashboardActivityKind;
  title: string;
  description: string;
  occurredAt: string;
  href?: string;
};

export type PlatformOnboardingRow = {
  id: string;
  name: string;
  slug: string;
  planName: string;
  centerCount: number;
  status: "completed" | "setup" | "pending";
  statusLabel: string;
  meta: string;
  logoUrl: string | null;
};

export type PlatformEnrollmentPoint = {
  key: string;
  label: string;
  value: number;
};

export type PlatformDashboardHome = {
  activeBrands: number;
  totalBrands: number;
  activeBrandsTrend: string | null;
  totalCenters: number;
  centersTrend: string | null;
  regionCount: number;
  planCount: number;
  planNames: string;
  plansTrend: string | null;
  monthlyEnrollments: PlatformEnrollmentPoint[];
  quarterlyEnrollments: PlatformEnrollmentPoint[];
  peakEnrollment: number;
  enterpriseLeadsConverted: number;
  enterpriseAvatars: { key: string; label: string; imageUrl?: string | null }[];
  extraEnterpriseCount: number;
  onboardingRows: PlatformOnboardingRow[];
  activities: PlatformDashboardActivity[];
};

export function platformDashboardGreeting(displayName: string, hour = new Date().getHours()): string {
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = displayName.trim() || "Platform";
  return `${greeting}, ${name} 👋`;
}

export function formatEnrollmentCount(value: number): string {
  return value.toLocaleString();
}

export function brandOnboardingStatus(
  status: string
): { tone: PlatformOnboardingRow["status"]; label: string } {
  if (status === "active") return { tone: "completed", label: "Completed" };
  if (status === "draft") return { tone: "setup", label: "Setup Phase" };
  return { tone: "pending", label: "Pending" };
}

export function brandOnboardingMeta(status: string, createdAt: string, nowMs = Date.now()): string {
  const relative = formatCompactRelative(createdAt, nowMs);
  if (status === "active") return `Onboarded: ${relative}`;
  return `Started: ${relative}`;
}

export function buildPlatformActivityFeed(
  brands: { id: string; name: string; slug: string; created_at: string }[],
  signups: { id: string; brand_name: string; created_at: string }[],
  nowMs = Date.now()
): PlatformDashboardActivity[] {
  const items: PlatformDashboardActivity[] = [];

  for (const brand of brands.slice(0, 3)) {
    items.push({
      id: `brand-${brand.id}`,
      kind: "brand",
      title: "New Franchise Created",
      description: `${brand.name} launched on the platform.`,
      occurredAt: brand.created_at,
      href: `/admin/brands/${brand.slug}`,
    });
  }

  for (const signup of signups.slice(0, 2)) {
    items.push({
      id: `signup-${signup.id}`,
      kind: "signup",
      title: "Brand Signup Request",
      description: `${signup.brand_name} submitted a platform signup.`,
      occurredAt: signup.created_at,
      href: "/admin/brands",
    });
  }

  if (items.length < 4) {
    items.push({
      id: "security-stub",
      kind: "security",
      title: "Security Posture Updated",
      description: "WAF rules refreshed across all tenant regions.",
      occurredAt: new Date(nowMs - 6 * 60 * 60 * 1000).toISOString(),
      href: "/admin/settings",
    });
  }

  return items
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 4);
}

export function enterpriseAvatarLabel(name: string): string {
  return initialsFromName(name).slice(0, 2);
}

export function percentTrendLabel(current: number, prior: number): string | null {
  if (prior <= 0) {
    if (current <= 0) return null;
    return `+${current}`;
  }
  const delta = ((current - prior) / prior) * 100;
  if (Math.abs(delta) < 0.5) return null;
  const rounded = Math.abs(delta) >= 10 ? Math.round(delta) : Math.round(delta * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function countTrendLabel(current: number, prior: number): string | null {
  const delta = current - prior;
  if (delta === 0) return null;
  return `${delta > 0 ? "+" : ""}${delta}`;
}
