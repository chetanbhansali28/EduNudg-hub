export type CurriculumStatus = "draft" | "published" | "archived";

export interface CurriculumVersion {
  id: string;
  program_id: string;
  version_number: number;
  status: CurriculumStatus;
  published_at?: string | null;
}

export const DEFAULT_UNITS_MODULE_TITLE = "Units";

export function topicsToString(topics: string[] | unknown): string {
  return Array.isArray(topics) ? topics.filter((t) => typeof t === "string").join(", ") : "";
}

export function parseTopicsComma(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Prefer the latest draft for editing; otherwise the latest published; otherwise newest version. */
export function pickWorkingVersion(versions: CurriculumVersion[]): CurriculumVersion | null {
  if (versions.length === 0) return null;
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);
  const latestDraft = sorted.find((v) => v.status === "draft");
  if (latestDraft) return latestDraft;
  const latestPublished = sorted.find((v) => v.status === "published");
  if (latestPublished) return latestPublished;
  return sorted[0] ?? null;
}

export function pickPublishedVersion(versions: CurriculumVersion[]): CurriculumVersion | null {
  const published = versions.filter((v) => v.status === "published");
  if (published.length === 0) return null;
  return published.sort((a, b) => b.version_number - a.version_number)[0] ?? null;
}

export type CurriculumPublishLabel = "live" | "draft" | "draft_with_live";

export function getPublishLabel(
  working: CurriculumVersion | null,
  published: CurriculumVersion | null,
): CurriculumPublishLabel {
  if (!working) return "draft";
  if (working.status === "published") return "live";
  if (published) return "draft_with_live";
  return "draft";
}

export function publishLabelText(label: CurriculumPublishLabel): string {
  switch (label) {
    case "live":
      return "Live on website";
    case "draft_with_live":
      return "Draft changes — not yet live";
    default:
      return "Draft — not yet live";
  }
}
