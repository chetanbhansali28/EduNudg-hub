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

export type CenterHealthCheckKey =
  | "curriculum"
  | "feedback"
  | "students"
  | "franchises"
  | "homepage"
  | "centerSite";

export type CenterHealthCheck = {
  key: CenterHealthCheckKey;
  label: string;
  current: number;
  required: number;
  met: boolean;
  remaining: number;
  href: string;
  reason: string;
};

export type CenterHealthScore = {
  percent: number;
  checks: CenterHealthCheck[];
  unmetReasons: string[];
};

export const CENTER_HEALTH_CHECK_COUNT = 6;

const CENTER_HEALTH_RULES: {
  key: CenterHealthCheckKey;
  label: string;
  singular: string;
  plural: string;
  required: number;
  href: string;
  todoLabel?: string;
  doneLabel?: string;
}[] = [
  { key: "curriculum", label: "Curriculum", singular: "curriculum", plural: "curricula", required: 1, href: "/app/curriculum" },
  { key: "feedback", label: "Feedback", singular: "feedback", plural: "feedbacks", required: 2, href: "/app/success-stories" },
  { key: "students", label: "Students", singular: "student", plural: "students", required: 2, href: "/app/students" },
  { key: "franchises", label: "Franchises", singular: "franchise", plural: "franchises", required: 2, href: "/app/centers" },
  {
    key: "homepage",
    label: "Homepage",
    singular: "homepage",
    plural: "homepages",
    required: 1,
    href: "/app/homepage",
    todoLabel: "Set homepage content",
    doneLabel: "Homepage content is set",
  },
  {
    key: "centerSite",
    label: "Franchise site",
    singular: "franchise site",
    plural: "franchise sites",
    required: 1,
    href: "/app/center-site",
    todoLabel: "Set franchise site content",
    doneLabel: "Franchise site content is set",
  },
];

export function centerHealthReason(input: {
  singular: string;
  plural: string;
  current: number;
  required: number;
}): string {
  const remaining = Math.max(0, input.required - input.current);
  const noun = remaining === 1 ? input.singular : input.plural;
  if (input.current <= 0) {
    return `Add ${input.required} ${input.required === 1 ? input.singular : input.plural} (${input.current} of ${input.required})`;
  }
  return `Add ${remaining} more ${noun} (${input.current} of ${input.required})`;
}

/** Equal-weight setup checks. 100% only when every minimum is met. */
export function buildCenterHealthScore(input: {
  curriculumCount: number;
  feedbackCount: number;
  studentCount: number;
  franchiseCount: number;
  homepageSet: boolean;
  centerSiteSet: boolean;
}): CenterHealthScore {
  const counts: Record<CenterHealthCheckKey, number> = {
    curriculum: input.curriculumCount,
    feedback: input.feedbackCount,
    students: input.studentCount,
    franchises: input.franchiseCount,
    homepage: input.homepageSet ? 1 : 0,
    centerSite: input.centerSiteSet ? 1 : 0,
  };

  const checks = CENTER_HEALTH_RULES.map((rule) => {
    const current = Math.max(0, counts[rule.key]);
    const remaining = Math.max(0, rule.required - current);
    const met = remaining === 0;
    return {
      key: rule.key,
      label: rule.label,
      current,
      required: rule.required,
      met,
      remaining,
      href: rule.href,
      reason: met
        ? (rule.doneLabel ?? `${rule.label} ${current} of ${rule.required}`)
        : (rule.todoLabel ??
          centerHealthReason({
            singular: rule.singular,
            plural: rule.plural,
            current,
            required: rule.required,
          })),
    };
  });

  const metCount = checks.filter((check) => check.met).length;
  return {
    percent: Math.round((metCount / CENTER_HEALTH_CHECK_COUNT) * 100),
    checks,
    unmetReasons: checks.filter((check) => !check.met).map((check) => check.reason),
  };
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
