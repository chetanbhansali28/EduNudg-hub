import type { CatalogAccent } from "@edunudg/ui";
import type { CenterBatchRow } from "@/lib/centerBatchesApi";
import {
  batchAccent,
  parseBatchSchedule,
  programNameFromBatch,
  resolveBatchCapacity,
} from "@/lib/centerDashboardHelpers";

export type BatchSort = "newest" | "oldest" | "name";
export type BatchProgramFilter = "all" | string;

export type BatchListPresentation = {
  id: string;
  name: string;
  programName: string | null;
  levelRange: string;
  enrollmentLabel: string;
  enrollmentTone: "active" | "full" | "neutral";
  enrollmentOpen: boolean;
  statusLabel: string;
  statusTone: "open" | "closed";
  accent: CatalogAccent;
};

export function formatBatchLevelRange(batch: CenterBatchRow): string {
  const start = batch.level_start?.name ?? "Level ?";
  const end = batch.level_end?.name ?? "Level ?";
  return `${start} to ${end}`;
}

export function formatBatchEnrollmentLabel(enrolled: number, capacity: number): {
  label: string;
  tone: BatchListPresentation["enrollmentTone"];
} {
  if (capacity > 0 && enrolled >= capacity) {
    return { label: `${capacity}/${capacity} Full`, tone: "full" };
  }
  if (capacity > 0) {
    return { label: `${enrolled}/${capacity} Students`, tone: "active" };
  }
  return { label: `${enrolled} Students`, tone: "neutral" };
}

export function buildBatchListPresentation(
  batch: CenterBatchRow,
  enrolled: number
): BatchListPresentation {
  const schedule = parseBatchSchedule(batch.schedule);
  const capacity = resolveBatchCapacity(enrolled, schedule);
  const enrollment = formatBatchEnrollmentLabel(enrolled, capacity);
  const accent = batchAccent(batch.name) as CatalogAccent;

  return {
    id: batch.id,
    name: batch.name,
    programName: programNameFromBatch(batch),
    levelRange: formatBatchLevelRange(batch),
    enrollmentLabel: enrollment.label,
    enrollmentTone: enrollment.tone,
    enrollmentOpen: batch.is_open_for_enrollment,
    statusLabel: batch.is_open_for_enrollment ? "Open Enrollment" : "Closed",
    statusTone: batch.is_open_for_enrollment ? "open" : "closed",
    accent,
  };
}

export function buildProgramFilterOptions(
  programs: { id: string; name: string }[]
): { value: BatchProgramFilter; label: string }[] {
  return [
    { value: "all", label: "All Batches" },
    ...programs.map((program) => ({ value: program.id, label: program.name })),
  ];
}

export function filterBatchesByProgram(
  batches: CenterBatchRow[],
  programId: BatchProgramFilter
): CenterBatchRow[] {
  if (programId === "all") return batches;
  return batches.filter((batch) => batch.program_id === programId);
}

export function sortCenterBatches(batches: CenterBatchRow[], sort: BatchSort): CenterBatchRow[] {
  const copy = [...batches];
  if (sort === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  const byCreated = (batch: CenterBatchRow) =>
    batch.created_at ? new Date(batch.created_at).getTime() : 0;
  copy.sort((a, b) => byCreated(b) - byCreated(a));
  return sort === "oldest" ? copy.reverse() : copy;
}

export function exportBatchesCsv(
  batches: CenterBatchRow[],
  enrollmentByBatch: Map<string, number>
): void {
  const header = ["Name", "Course", "Level Start", "Level End", "Enrollment", "Open Enrollment"];
  const rows = batches.map((batch) => {
    const enrolled = enrollmentByBatch.get(batch.id) ?? 0;
    const schedule = parseBatchSchedule(batch.schedule);
    const capacity = resolveBatchCapacity(enrolled, schedule);
    return [
      batch.name,
      programNameFromBatch(batch) ?? "",
      batch.level_start?.name ?? "",
      batch.level_end?.name ?? "",
      capacity > 0 ? `${enrolled}/${capacity}` : String(enrolled),
      batch.is_open_for_enrollment ? "Yes" : "No",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "active-batches.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export const BATCH_SORT_OPTIONS: { value: BatchSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
];
