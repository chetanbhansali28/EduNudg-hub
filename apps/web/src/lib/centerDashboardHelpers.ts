import type { CenterBatchRow } from "@/lib/centerBatchesApi";

export type BatchSchedule = {
  days?: string[];
  start_time?: string;
  end_time?: string;
  room?: string;
  max_students?: number;
};

export type BatchSessionStatus = "live" | "upcoming" | "scheduled";

export type DashboardBatchCard = {
  id: string;
  name: string;
  programName: string | null;
  location: string;
  timeRange: string;
  status: BatchSessionStatus;
  statusLabel: string;
  enrolledStudents: number;
  capacity: number;
  progressPercent: number;
  accent: "blue" | "purple" | "teal" | "rose";
};

export type DashboardActionItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  tone: "blue" | "purple" | "red" | "pink";
  kind: "lead" | "fee" | "curriculum" | "inventory" | "batch";
};

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function formatDashboardDate(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
    .format(now)
    .toUpperCase();
}

export function parseBatchSchedule(schedule: Record<string, unknown> | null): BatchSchedule {
  if (!schedule || typeof schedule !== "object") return {};
  const days = Array.isArray(schedule.days)
    ? schedule.days.filter((d): d is string => typeof d === "string")
    : undefined;
  return {
    days,
    start_time: typeof schedule.start_time === "string" ? schedule.start_time : undefined,
    end_time: typeof schedule.end_time === "string" ? schedule.end_time : undefined,
    room: typeof schedule.room === "string" ? schedule.room : undefined,
    max_students: typeof schedule.max_students === "number" ? schedule.max_students : undefined,
  };
}

export function isBatchScheduledToday(schedule: BatchSchedule, now: Date): boolean {
  if (!schedule.days?.length) return true;
  const today = DAY_NAMES[now.getDay()];
  return schedule.days.some((d) => d.toLowerCase() === today);
}

function parseTimeMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTimeLabel(value: string | undefined): string {
  const minutes = parseTimeMinutes(value);
  if (minutes == null) return "—";
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function formatBatchTimeRange(schedule: BatchSchedule): string {
  if (!schedule.start_time && !schedule.end_time) return "Schedule on request";
  const start = formatTimeLabel(schedule.start_time);
  const end = formatTimeLabel(schedule.end_time);
  if (start === "—" && end === "—") return "Schedule on request";
  if (end === "—") return start;
  if (start === "—") return end;
  return `${start} - ${end}`;
}

export function getBatchSessionStatus(schedule: BatchSchedule, now: Date): {
  status: BatchSessionStatus;
  statusLabel: string;
} {
  if (!isBatchScheduledToday(schedule, now)) {
    return { status: "scheduled", statusLabel: "SCHEDULED" };
  }

  const start = parseTimeMinutes(schedule.start_time);
  const end = parseTimeMinutes(schedule.end_time);
  const current = now.getHours() * 60 + now.getMinutes();

  if (start != null && end != null) {
    if (current >= start && current < end) {
      return { status: "live", statusLabel: "LIVE NOW" };
    }
    if (current < start) {
      const diffHours = Math.max(1, Math.ceil((start - current) / 60));
      return { status: "upcoming", statusLabel: `STARTS IN ${diffHours}H` };
    }
    return { status: "scheduled", statusLabel: "COMPLETED" };
  }

  if (start != null && current < start) {
    const diffHours = Math.max(1, Math.ceil((start - current) / 60));
    return { status: "upcoming", statusLabel: `STARTS IN ${diffHours}H` };
  }

  return { status: "scheduled", statusLabel: "TODAY" };
}

export function sortDashboardBatches(batches: DashboardBatchCard[]): DashboardBatchCard[] {
  const rank: Record<BatchSessionStatus, number> = { live: 0, upcoming: 1, scheduled: 2 };
  return [...batches].sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
}

export function batchAccent(name: string): DashboardBatchCard["accent"] {
  const lower = name.toLowerCase();
  if (lower.includes("robot") || lower.includes("iot")) return "teal";
  if (lower.includes("data") || lower.includes("science") || lower.includes("ai")) return "purple";
  if (lower.includes("abacus") || lower.includes("math")) return "blue";
  return "rose";
}

export function computeBatchProgress(enrolled: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((enrolled / capacity) * 100));
}

export function resolveBatchCapacity(enrolled: number, schedule: BatchSchedule): number {
  if (schedule.max_students && schedule.max_students > 0) return schedule.max_students;
  return Math.max(enrolled, 15);
}

export function programNameFromBatch(batch: CenterBatchRow): string | null {
  const program = batch.programs;
  if (Array.isArray(program)) return program[0]?.name ?? null;
  return program?.name ?? null;
}

export function buildDashboardBatchCard(
  batch: CenterBatchRow,
  enrolled: number,
  now: Date
): DashboardBatchCard {
  const schedule = parseBatchSchedule(batch.schedule);
  const { status, statusLabel } = getBatchSessionStatus(schedule, now);
  const capacity = resolveBatchCapacity(enrolled, schedule);
  const location = schedule.room ?? "Center";
  return {
    id: batch.id,
    name: batch.name,
    programName: programNameFromBatch(batch),
    location,
    timeRange: formatBatchTimeRange(schedule),
    status,
    statusLabel,
    enrolledStudents: enrolled,
    capacity,
    progressPercent: computeBatchProgress(enrolled, capacity),
    accent: batchAccent(batch.name),
  };
}

export function countBatchesToday(
  batches: CenterBatchRow[],
  now: Date
): number {
  return batches.filter((batch) => isBatchScheduledToday(parseBatchSchedule(batch.schedule), now)).length;
}

export function findNextBatchTimeLabel(batches: CenterBatchRow[], now: Date): string | null {
  const today = batches
    .map((batch) => {
      const schedule = parseBatchSchedule(batch.schedule);
      const start = parseTimeMinutes(schedule.start_time);
      if (!isBatchScheduledToday(schedule, now) || start == null) return null;
      const current = now.getHours() * 60 + now.getMinutes();
      if (start <= current) return null;
      return { start, label: formatTimeLabel(schedule.start_time) };
    })
    .filter((row): row is { start: number; label: string } => row != null)
    .sort((a, b) => a.start - b.start);

  return today[0]?.label ?? null;
}

export function buildDashboardActionItems(input: {
  qualifiedLeadName: string | null;
  overdueInvoiceCount: number;
  overdueBatchName: string | null;
  lowStockItems: number;
  unseenBatchJoins: number;
}): DashboardActionItem[] {
  const items: DashboardActionItem[] = [];

  if (input.qualifiedLeadName) {
    items.push({
      id: "lead-follow-up",
      title: "Follow up on Lead",
      subtitle: `${input.qualifiedLeadName} expressed interest.`,
      href: "/app/leads",
      tone: "purple",
      kind: "lead",
    });
  }

  if (input.overdueInvoiceCount > 0) {
    items.push({
      id: "fee-reminder",
      title: "Pending Fee Reminder",
      subtitle:
        input.overdueBatchName != null
          ? `${input.overdueInvoiceCount} student${input.overdueInvoiceCount === 1 ? "" : "s"} from ${input.overdueBatchName}.`
          : `${input.overdueInvoiceCount} overdue invoice${input.overdueInvoiceCount === 1 ? "" : "s"}.`,
      href: "/app/fees",
      tone: "red",
      kind: "fee",
    });
  }

  if (input.unseenBatchJoins > 0) {
    items.push({
      id: "batch-joins",
      title: "Review batch joins",
      subtitle: `${input.unseenBatchJoins} new student${input.unseenBatchJoins === 1 ? "" : "s"} joined a batch.`,
      href: "/app/batches",
      tone: "blue",
      kind: "batch",
    });
  }

  if (input.lowStockItems > 0) {
    items.push({
      id: "low-stock",
      title: "Restock inventory",
      subtitle: `${input.lowStockItems} item${input.lowStockItems === 1 ? "" : "s"} at or below threshold.`,
      href: "/app/inventory",
      tone: "pink",
      kind: "inventory",
    });
  }

  items.push({
    id: "curriculum",
    title: "Update Curriculum",
    subtitle: "Review programs and levels for your center.",
    href: "/app/curriculum",
    tone: "pink",
    kind: "curriculum",
  });

  return items.slice(0, 4);
}

export function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
