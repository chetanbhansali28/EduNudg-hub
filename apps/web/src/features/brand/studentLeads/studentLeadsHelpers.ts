import type { LeadBadgeTone } from "@edunudg/ui";
import type { LeadRow } from "@/lib/leadsApi";
import { isLeadStale, leadAgeDays } from "@/lib/leadSla";
import { initialsFromName } from "@/lib/welcomeMessage";

export type LeadFilter = "unassigned" | "stale" | "lost" | "converted" | "all";

export const LEAD_FILTER_OPTIONS: { value: LeadFilter; label: string; mobileLabel: string }[] = [
  { value: "unassigned", label: "Unassigned", mobileLabel: "Unassigned" },
  { value: "stale", label: "Needs attention", mobileLabel: "Needs attention" },
  { value: "lost", label: "Lost", mobileLabel: "Lost" },
  { value: "converted", label: "Converted", mobileLabel: "Converted" },
  { value: "all", label: "All", mobileLabel: "All leads" },
];

export type LeadSort = "newest" | "oldest";

export function isUnassignedLead(lead: LeadRow): boolean {
  return !lead.center_id && lead.status !== "lost" && lead.status !== "converted";
}

export function isConvertedLead(lead: LeadRow): boolean {
  return lead.status === "converted";
}

export function leadCounts(leads: LeadRow[], nowMs = Date.now()) {
  return {
    unassigned: leads.filter(isUnassignedLead).length,
    stale: leads.filter((lead) => isLeadStale(lead, nowMs)).length,
    lost: leads.filter((lead) => lead.status === "lost").length,
    converted: leads.filter(isConvertedLead).length,
    all: leads.length,
  };
}

export function filterLeads(leads: LeadRow[], filter: LeadFilter, nowMs = Date.now()): LeadRow[] {
  if (filter === "unassigned") return leads.filter(isUnassignedLead);
  if (filter === "stale") return leads.filter((lead) => isLeadStale(lead, nowMs));
  if (filter === "lost") return leads.filter((lead) => lead.status === "lost");
  if (filter === "converted") return leads.filter(isConvertedLead);
  return leads;
}

export function sortLeads(leads: LeadRow[], sort: LeadSort): LeadRow[] {
  const sorted = [...leads];
  sorted.sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });
  return sorted;
}

export function leadListTitle(lead: LeadRow): string {
  return lead.parent_name ?? lead.full_name;
}

export function leadListLocation(lead: LeadRow): string | null {
  const location = [lead.city, lead.pincode].filter(Boolean).join(" ");
  return location || null;
}

export function leadListMeta(lead: LeadRow): string {
  const phone = lead.whatsapp_e164 ?? "—";
  const location = leadListLocation(lead);
  return location ? `${phone} • ${location}` : phone;
}

export function leadAvatarTone(seed: string): "blue" | "purple" | "teal" | "amber" | "gray" {
  const tones = ["blue", "purple", "teal", "amber"] as const;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return tones[hash % tones.length] ?? "blue";
}

export function leadInitials(lead: LeadRow): string {
  return initialsFromName(leadListTitle(lead));
}

export function leadStatusPresentation(lead: LeadRow): { label: string; tone: LeadBadgeTone } {
  if (lead.status === "converted") return { label: "CONVERTED", tone: "converted" };
  if (lead.status === "lost") return { label: "LOST", tone: "lost" };
  if (lead.status === "new") return { label: "NEW", tone: "new" };
  if (lead.status === "contacted" || lead.status === "qualified") {
    return { label: lead.status.toUpperCase(), tone: "attention" };
  }
  return { label: "OPEN", tone: "neutral" };
}

export function leadSourcePresentation(source: string | null): { label: string; tone: LeadBadgeTone } {
  const normalized = (source ?? "brand").toLowerCase();
  if (normalized === "center") return { label: "CENTER", tone: "center" };
  return { label: "BRAND", tone: "brand" };
}

export function formatLeadListWhen(iso: string, nowMs = Date.now()): string {
  const days = leadAgeDays(iso, nowMs);
  if (days < 7) return `${days}d ago`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatLeadSubmittedWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `Submitted ${date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function formatLeadSubmittedRelative(iso: string, nowMs = Date.now()): string {
  const days = leadAgeDays(iso, nowMs);
  if (days <= 0) return "Submitted today";
  if (days === 1) return "Submitted 1d ago";
  return `Submitted ${days}d ago`;
}

export function childAgeFromDob(dob: string | null): string | null {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const years = Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${dob} (${years} Years)`;
}

export function leadGridFields(lead: LeadRow): { label: string; value: string }[] {
  return [
    { label: "Student Name", value: lead.child_name ?? "—" },
    { label: "DOB", value: lead.child_dob ?? "—" },
    { label: "Contact", value: lead.whatsapp_e164 ?? "—" },
    { label: "Location", value: [lead.city, lead.pincode].filter(Boolean).join(", ") || "—" },
  ];
}

export function leadListLines(
  lead: LeadRow,
  centerName?: string
): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];
  if (lead.child_name) lines.push({ label: "Child", value: lead.child_name });
  if (centerName) lines.push({ label: "Assigned", value: centerName });
  return lines;
}

export function staleLeadInsight(leads: LeadRow[], nowMs = Date.now()) {
  const stale = leads.filter((lead) => isLeadStale(lead, nowMs));
  const unassigned = leads.filter(isUnassignedLead).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const focus = stale[0] ?? unassigned[0];
  if (!focus) return null;

  const days = leadAgeDays(focus.created_at, nowMs);
  return {
    leadName: leadListTitle(focus),
    days,
    body: `Your response time for '${leadListTitle(focus)}' is currently ${days} day${days === 1 ? "" : "s"}. The benchmark for high-conversion leads is 24 hours.`,
  };
}

export function averageResponseHours(leads: LeadRow[], nowMs = Date.now()): number {
  const open = leads.filter((lead) => lead.status !== "lost" && lead.status !== "converted");
  if (open.length === 0) return 0;
  const totalHours = open.reduce((sum, lead) => sum + leadAgeDays(lead.created_at, nowMs) * 24, 0);
  return Math.round((totalHours / open.length) * 10) / 10;
}

export function buildLeadTasks(leads: LeadRow[], nowMs = Date.now()) {
  return leads
    .filter((lead) => isLeadStale(lead, nowMs) || isUnassignedLead(lead))
    .slice(0, 4)
    .map((lead) => ({
      key: lead.id,
      label: isUnassignedLead(lead) ? `Assign ${leadListTitle(lead)}` : `Follow up ${leadListTitle(lead)}`,
      time: isLeadStale(lead, nowMs) ? "Overdue" : `${leadAgeDays(lead.created_at, nowMs)}d open`,
    }));
}

export function leadsExportCsv(leads: LeadRow[]): string {
  const header = "Parent,WhatsApp,Email,Child,City,Pincode,Status,Source,Created";
  const rows = leads.map((lead) =>
    [
      `"${leadListTitle(lead)}"`,
      lead.whatsapp_e164 ?? "",
      lead.email ?? "",
      lead.child_name ?? "",
      lead.city ?? "",
      lead.pincode ?? "",
      lead.status,
      lead.lead_source ?? "",
      lead.created_at,
    ].join(",")
  );
  return `${header}\n${rows.join("\n")}`;
}

export function downloadLeadsCsv(leads: LeadRow[]) {
  const blob = new Blob([leadsExportCsv(leads)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "student-leads.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function filterTabOptions(counts: ReturnType<typeof leadCounts>) {
  return LEAD_FILTER_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    count: counts[option.value],
  }));
}

export function mobileKpiFilter(filter: LeadFilter): LeadFilter {
  if (filter === "converted") return "all";
  return filter;
}
