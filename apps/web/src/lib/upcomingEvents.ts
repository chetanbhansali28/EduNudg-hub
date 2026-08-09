import type { HomepageUpcomingEvent, HomepageUpcomingEventsSection } from "@/types/homepage";

/** Local calendar date as YYYY-MM-DD (browser timezone). */
export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eventEndDate(event: HomepageUpcomingEvent): string {
  return (event.endDate?.trim() || event.startDate?.trim() || "").slice(0, 10);
}

/** Still visible when end date (or start if no end) is today or later. */
export function isUpcomingEvent(event: HomepageUpcomingEvent, today = todayIsoDate()): boolean {
  const start = event.startDate?.trim().slice(0, 10);
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return false;
  const end = eventEndDate(event);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return false;
  return end >= today;
}

export function compareUpcomingEvents(a: HomepageUpcomingEvent, b: HomepageUpcomingEvent): number {
  const as = a.startDate.slice(0, 10);
  const bs = b.startDate.slice(0, 10);
  if (as !== bs) return as.localeCompare(bs);
  return (a.title || "").localeCompare(b.title || "");
}

/** Upcoming items sorted soonest-first, optionally capped by maxItems. */
export function resolveVisibleUpcomingEvents(
  section: HomepageUpcomingEventsSection | undefined | null,
  today = todayIsoDate()
): HomepageUpcomingEvent[] {
  if (!section?.items?.length) return [];
  const upcoming = section.items.filter((item) => isUpcomingEvent(item, today)).sort(compareUpcomingEvents);
  const max = section.maxItems && section.maxItems > 0 ? Math.floor(section.maxItems) : 0;
  return max > 0 ? upcoming.slice(0, max) : upcoming;
}

export function upcomingEventsSectionHasContent(
  section: HomepageUpcomingEventsSection | undefined | null,
  today = todayIsoDate()
): boolean {
  return resolveVisibleUpcomingEvents(section, today).length > 0;
}

export const HOMEPAGE_EVENT_TYPE_LABELS: Record<HomepageUpcomingEvent["type"], string> = {
  competition: "Competition",
  workshop: "Workshop",
  demo: "Open house / demo",
  other: "Other",
};

export function formatEventDateBadge(isoDate: string): { month: string; day: string } {
  const raw = isoDate.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return { month: "", day: "" };
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate());
  return { month, day };
}

export function formatEventScheduleLine(event: HomepageUpcomingEvent): string {
  const parts: string[] = [];
  if (event.startTime?.trim()) {
    parts.push(
      event.endTime?.trim() ? `${event.startTime.trim()} – ${event.endTime.trim()}` : event.startTime.trim()
    );
  }
  if (event.duration?.trim()) parts.push(event.duration.trim());
  return parts.join(" · ");
}

export function emptyUpcomingEvent(): HomepageUpcomingEvent {
  return {
    type: "competition",
    title: "",
    startDate: todayIsoDate(),
    description: "",
    location: "",
    ctaLabel: "Learn more",
    ctaHref: "enroll",
  };
}

export function emptyUpcomingEventsSection(): HomepageUpcomingEventsSection {
  return {
    eyebrow: "UPCOMING EVENTS",
    title: "Competitions, workshops & demos",
    subtitle: "What’s next for students and parents.",
    maxItems: 6,
    items: [],
  };
}
