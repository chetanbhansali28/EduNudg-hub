import type { CenterStatusTone } from "@edunudg/ui";
import type { BrandCenterRow, CenterStatus } from "@/lib/centerCentersApi";
import { initialsFromName } from "@/lib/welcomeMessage";

export type CenterFilter = "active" | "suspended" | "all";

export const CENTER_FILTER_OPTIONS: { value: CenterFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

const AVATAR_TONES = ["blue", "purple", "teal", "gray"] as const;

export function centerListTitle(center: BrandCenterRow): string {
  return center.display_name ?? center.name;
}

export function centerLocationLine(center: BrandCenterRow): string {
  return [center.city, center.region].filter(Boolean).join(", ") || center.slug;
}

export function centerFranchiseId(center: BrandCenterRow, brandPrefix = "EN"): string {
  const code = center.slug.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CTR";
  const num = center.id.replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `${brandPrefix}-${code}-${num}`;
}

export function centerInitials(center: BrandCenterRow): string {
  return initialsFromName(centerListTitle(center));
}

export function centerAvatarTone(index: number): (typeof AVATAR_TONES)[number] {
  return AVATAR_TONES[index % AVATAR_TONES.length]!;
}

export function centerStatusTone(status: CenterStatus): CenterStatusTone {
  if (status === "active") return "active";
  if (status === "suspended") return "suspended";
  if (status === "closed") return "closed";
  return "pending";
}

export function centerCounts(centers: BrandCenterRow[]) {
  return {
    total: centers.length,
    active: centers.filter((center) => center.status === "active").length,
    suspended: centers.filter((center) => center.status === "suspended").length,
    all: centers.length,
  };
}

export function filterCenters(centers: BrandCenterRow[], filter: CenterFilter): BrandCenterRow[] {
  if (filter === "active") return centers.filter((center) => center.status === "active");
  if (filter === "suspended") return centers.filter((center) => center.status === "suspended");
  return centers;
}

export function centerStatsItems(stats: {
  openLeads: number;
  students: number;
  activeEnrollments: number;
}) {
  return [
    { key: "leads", label: "Open Leads", value: stats.openLeads },
    { key: "students", label: "Students", value: stats.students },
    { key: "enrollments", label: "Active Enr.", value: stats.activeEnrollments },
  ];
}

export function programCurriculumSubtitle(ageLabel?: string | null, description?: string | null): string | undefined {
  const parts = [ageLabel?.trim(), description?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
