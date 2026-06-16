import type { BrandDailyTrendRow } from "@/lib/brandAnalyticsStats";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { greetingForHour, firstNameFromDisplayName } from "@/lib/welcomeMessage";

export type BrandDashboardActivityKind = "application" | "lead" | "onboarding" | "audit";

export type BrandDashboardActivity = {
  id: string;
  kind: BrandDashboardActivityKind;
  title: string;
  subtitle: string;
  href: string;
  occurredAt: string;
};

export type BrandExpansionGoal = {
  id: string;
  label: string;
  percent: number;
};

export type BrandCenterAvatar = {
  initials: string;
  tone: "blue" | "purple" | "teal" | "pink";
};

const AVATAR_TONES: BrandCenterAvatar["tone"][] = ["blue", "purple", "teal", "pink"];

export function brandDashboardGreeting(displayName: string, hour = new Date().getHours()): string {
  const name = firstNameFromDisplayName(displayName);
  return `${greetingForHour(hour)}, ${name === "there" ? "Director" : name}`;
}

export function formatCompactRelative(iso: string, nowMs = Date.now()): string {
  const diffSec = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}

export function formatInrCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_00_000) {
    const crore = rupees / 1_00_00_000;
    return `₹${crore >= 10 ? Math.round(crore) : crore.toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (rupees >= 1_00_000) {
    const lakh = rupees / 1_00_000;
    return `₹${lakh >= 10 ? Math.round(lakh) : lakh.toFixed(1).replace(/\.0$/, "")}L`;
  }
  return formatInrFromPaise(paise);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeCenterHealthPercent(activeCenters: number, totalCenters: number): number {
  if (totalCenters <= 0) return 0;
  return Math.round((activeCenters / totalCenters) * 100);
}

export function buildRevenueBarHeights(rows: BrandDailyTrendRow[], days = 7): number[] {
  const slice = rows.slice(0, days).reverse();
  const max = Math.max(...slice.map((row) => row.revenue_cents), 1);
  return slice.map((row) => row.revenue_cents / max);
}

export function computeRevenueTrendPercent(rows: BrandDailyTrendRow[]): number | null {
  const recent = rows.slice(0, 7).reduce((sum, row) => sum + row.revenue_cents, 0);
  const prior = rows.slice(7, 14).reduce((sum, row) => sum + row.revenue_cents, 0);
  return percentChange(recent, prior);
}

export function buildCenterAvatars(
  centers: { name: string }[],
  limit = 3
): { avatars: BrandCenterAvatar[]; extraCount: number } {
  const picked = centers.slice(0, limit);
  const avatars = picked.map((center, index) => ({
    initials: center.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    tone: AVATAR_TONES[index % AVATAR_TONES.length]!,
  }));
  return { avatars, extraCount: Math.max(0, centers.length - limit) };
}

export function buildExpansionGoals(
  centers: { region: string | null; city: string | null; status: string }[],
  maxCenters: number | null
): BrandExpansionGoal[] {
  const byRegion = new Map<string, number>();
  for (const center of centers) {
    if (center.status !== "active") continue;
    const label = center.region?.trim() || center.city?.trim();
    if (!label) continue;
    byRegion.set(label, (byRegion.get(label) ?? 0) + 1);
  }

  const cap = maxCenters && maxCenters > 0 ? maxCenters : Math.max(centers.length, 1);
  return [...byRegion.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, count]) => ({
      id: label,
      label,
      percent: Math.min(100, Math.round((count / cap) * 100)),
    }));
}

type InquiryRow = {
  id: string;
  full_name: string;
  proposed_franchise_name: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
};

type LeadRow = {
  id: string;
  full_name: string;
  child_name: string | null;
  city: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type CenterRow = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
};

export function buildBrandActivityFeed(input: {
  inquiries: InquiryRow[];
  leads: LeadRow[];
  centers: CenterRow[];
  staleLeads: number;
  nowMs?: number;
}): BrandDashboardActivity[] {
  const items: BrandDashboardActivity[] = [];

  for (const row of input.inquiries) {
    if (!["new", "contacted", "qualified"].includes(row.status)) continue;
    const titleName = row.proposed_franchise_name?.trim() || row.full_name.trim();
    const location = [row.city, row.state].filter(Boolean).join(", ");
    items.push({
      id: `inquiry-${row.id}`,
      kind: "application",
      title: `New Application: ${titleName}`,
      subtitle: location ? `Regional Hub • ${location}` : "Franchise application received",
      href: "/app/franchise-applications",
      occurredAt: row.created_at,
    });
  }

  for (const row of input.leads) {
    if (row.status !== "qualified") continue;
    const name = row.child_name?.trim() || row.full_name.trim();
    items.push({
      id: `lead-${row.id}`,
      kind: "lead",
      title: `Lead Alert: High Interest`,
      subtitle: `Contact: ${name}${row.city ? ` • ${row.city}` : ""}`,
      href: "/app/leads",
      occurredAt: row.updated_at || row.created_at,
    });
  }

  for (const row of input.centers) {
    if (row.status !== "active") continue;
    items.push({
      id: `center-${row.id}`,
      kind: "onboarding",
      title: "Onboarding Completed",
      subtitle: `${row.name} is now live`,
      href: `/app/centers`,
      occurredAt: row.updated_at,
    });
  }

  if (input.staleLeads > 0) {
    items.push({
      id: "audit-stale-leads",
      kind: "audit",
      title: "Audit Reminder",
      subtitle: `${input.staleLeads} lead${input.staleLeads === 1 ? "" : "s"} require routing attention`,
      href: "/app/leads",
      occurredAt: new Date(input.nowMs ?? Date.now()).toISOString(),
    });
  }

  return items
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 4);
}

export function unassignedLeadsHint(count: number): string {
  if (count <= 0) return "All student leads are routed";
  return "Needs immediate routing";
}

export function franchiseAppsHint(count: number): string {
  if (count <= 0) return "No applications awaiting review";
  return "Under review stage";
}

export function staleLeadsHint(count: number): string {
  if (count <= 0) return "Lead pipeline is current";
  return "Risk of conversion drop";
}
