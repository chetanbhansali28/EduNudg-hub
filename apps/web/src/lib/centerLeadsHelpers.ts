import { isLeadStale } from "@/lib/leadSla";
import type { LeadRow, LeadStatus } from "@/lib/leadsApi";
import { telHref } from "@edunudg/ui";

export { telHref };

export type LeadStatusTone = "new" | "contacted" | "trial" | "hot" | "lost" | "converted" | "neutral";

export type LeadTimelineItem = {
  id: string;
  title: string;
  detail?: string;
  time?: string;
};

export type LeadFilter = "open" | "lost" | "converted" | "all";

export type LeadPipelineStats = {
  open: number;
  lost: number;
  converted: number;
  all: number;
  stale: number;
  openWeekDeltaPct: number | null;
  lostMonthDeltaPct: number | null;
};

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function paginationLabel(total: number, page: number, pageSize: number): string {
  if (total === 0) return "Showing 0 leads";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start}-${end} of ${total} leads`;
}

function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function countInRange(
  leads: LeadRow[],
  predicate: (lead: LeadRow) => boolean,
  startMs: number,
  endMs: number
): number {
  return leads.filter((lead) => {
    const created = new Date(lead.created_at).getTime();
    return created >= startMs && created < endMs && predicate(lead);
  }).length;
}

export function computeLeadPipelineStats(leads: LeadRow[], nowMs = Date.now()): LeadPipelineStats {
  const now = new Date(nowMs);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const isOpen = (lead: LeadRow) => ["new", "contacted", "qualified"].includes(lead.status);
  const isLost = (lead: LeadRow) => lead.status === "lost";

  const openThisWeek = countInRange(leads, isOpen, weekAgo.getTime(), now.getTime());
  const openLastWeek = countInRange(leads, isOpen, twoWeeksAgo.getTime(), weekAgo.getTime());
  const lostThisMonth = countInRange(leads, isLost, monthAgo.getTime(), now.getTime());
  const lostLastMonth = countInRange(leads, isLost, twoMonthsAgo.getTime(), monthAgo.getTime());

  return {
    open: leads.filter(isOpen).length,
    lost: leads.filter(isLost).length,
    converted: leads.filter((lead) => lead.status === "converted").length,
    all: leads.length,
    stale: leads.filter((lead) => isLeadStale(lead, nowMs)).length,
    openWeekDeltaPct: percentDelta(openThisWeek, openLastWeek),
    lostMonthDeltaPct: percentDelta(lostThisMonth, lostLastMonth),
  };
}

export function filterCenterLeads(
  leads: LeadRow[],
  filter: LeadFilter,
  search: string
): LeadRow[] {
  const q = search.trim().toLowerCase();
  return leads.filter((lead) => {
    const matchesFilter =
      filter === "open"
        ? ["new", "contacted", "qualified"].includes(lead.status)
        : filter === "lost"
          ? lead.status === "lost"
          : filter === "converted"
            ? lead.status === "converted"
            : true;
    if (!matchesFilter) return false;
    if (!q) return true;
    return [lead.full_name, lead.parent_name, lead.email, lead.whatsapp_e164, lead.child_name]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
  });
}

export function leadDisplayName(lead: LeadRow): string {
  return lead.parent_name ?? lead.full_name;
}

export function leadStatusPresentation(
  lead: LeadRow,
  nowMs = Date.now()
): { label: string; tone: LeadStatusTone } {
  if (isLeadStale(lead, nowMs) && lead.status !== "converted" && lead.status !== "lost") {
    return { label: "Hot Lead", tone: "hot" };
  }
  switch (lead.status) {
    case "new":
      return { label: "New", tone: "new" };
    case "contacted":
      return { label: "Contacted", tone: "contacted" };
    case "qualified":
      return { label: "Decision Pending", tone: "trial" };
    case "lost":
      return { label: "Lost", tone: "lost" };
    case "converted":
      return { label: "Converted", tone: "converted" };
    default:
      return { label: lead.status, tone: "neutral" };
  }
}

export function leadStudentInterest(lead: LeadRow): { title: string; subtitle: string } {
  const title = lead.child_name ? `${lead.child_name}` : "General inquiry";
  const subtitle =
    lead.status === "qualified"
      ? "Trial pending"
      : lead.status === "contacted"
        ? "Follow-up in progress"
        : lead.status === "new"
          ? "Awaiting first contact"
          : lead.status === "converted"
            ? "Enrolled"
            : lead.status === "lost"
              ? "Closed"
              : "Open lead";
  return { title, subtitle };
}

export function formatLeadContactWhen(
  iso: string | null | undefined,
  nowMs = Date.now()
): { label: string; followUpDue: boolean } {
  if (!iso) return { label: "Not contacted", followUpDue: true };
  const date = new Date(iso);
  const now = new Date(nowMs);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) {
    return { label: `Today, ${time}`, followUpDue: false };
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return { label: `Yesterday, ${time}`, followUpDue: false };
  }
  return { label: date.toLocaleString(), followUpDue: false };
}

export function leadContactTimestamp(lead: LeadRow): string | null {
  return lead.last_center_action_at ?? lead.assigned_at ?? lead.created_at;
}

export function buildLeadTimeline(lead: LeadRow): LeadTimelineItem[] {
  const items: LeadTimelineItem[] = [];

  items.push({
    id: "created",
    title: "Lead Created",
    detail: lead.lead_source
      ? `Source: ${lead.lead_source === "center" ? "Center registration" : lead.lead_source}`
      : undefined,
    time: new Date(lead.created_at).toLocaleString(),
  });

  if (lead.assigned_at) {
    items.push({
      id: "assigned",
      title: "Assigned to center",
      time: new Date(lead.assigned_at).toLocaleString(),
    });
  }

  if (lead.whatsapp_e164) {
    items.push({
      id: "whatsapp",
      title: "WhatsApp available",
      detail: lead.whatsapp_e164,
      time: lead.last_center_action_at
        ? new Date(lead.last_center_action_at).toLocaleString()
        : undefined,
    });
  }

  if (lead.last_center_action_at) {
    items.push({
      id: "action",
      title: "Called Parent",
      detail: `Status updated to ${lead.status}`,
      time: new Date(lead.last_center_action_at).toLocaleString(),
    });
  }

  if (lead.lost_reason?.trim()) {
    items.push({
      id: "lost",
      title: "Marked lost",
      detail: lead.lost_reason,
    });
  }

  return items.reverse();
}

export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function openPipelineHint(stats: LeadPipelineStats): string | null {
  if (stats.stale > 0) {
    return `${stats.stale} lead${stats.stale === 1 ? "" : "s"} exceeded Brand SLA`;
  }
  if (stats.openWeekDeltaPct != null) {
    const sign = stats.openWeekDeltaPct >= 0 ? "+" : "";
    return `${sign}${stats.openWeekDeltaPct}% from last week`;
  }
  return null;
}

export function lostPipelineHint(stats: LeadPipelineStats): string | null {
  if (stats.lostMonthDeltaPct != null) {
    const sign = stats.lostMonthDeltaPct >= 0 ? "+" : "";
    return `${sign}${stats.lostMonthDeltaPct}% from last month`;
  }
  return null;
}

export function convertedPipelineHint(convertedCount: number): string {
  if (convertedCount === 0) return "No conversions yet";
  return `${convertedCount} student${convertedCount === 1 ? "" : "s"} enrolled`;
}

export const LEAD_PAGE_SIZE = 10;

export const LEAD_FILTER_OPTIONS: { value: LeadFilter; label: string }[] = [
  { value: "open", label: "Open Pipeline" },
  { value: "lost", label: "Lost" },
  { value: "converted", label: "Converted" },
  { value: "all", label: "All" },
];

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
];
