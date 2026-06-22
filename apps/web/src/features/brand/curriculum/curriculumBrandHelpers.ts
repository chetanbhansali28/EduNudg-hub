import type { CurriculumProgram } from "@/lib/curriculumApi";
import type { CurriculumCourseStatus } from "@edunudg/ui";
import { initialsFromName } from "@/lib/welcomeMessage";

export type CurriculumTabFilter = "active" | "drafts" | "archived";

const AVATAR_TONES = ["blue", "purple", "teal", "pink"] as const;

export function courseStatus(program: CurriculumProgram): CurriculumCourseStatus {
  if (program.is_active) return "active";
  return "draft";
}

export function courseAvatarTone(index: number): (typeof AVATAR_TONES)[number] {
  return AVATAR_TONES[index % AVATAR_TONES.length]!;
}

export function courseInitials(name: string): string {
  return initialsFromName(name);
}

export function courseMetaLine(program: CurriculumProgram, programCount: number): string {
  const levelLabel = program.age_label?.trim() || "All levels";
  const programsLabel = `${programCount} program${programCount === 1 ? "" : "s"}`;
  return `${levelLabel} • ${programsLabel}`;
}

export function courseExcerpt(description: string | null | undefined, max = 96): string {
  const text = description?.trim();
  if (!text) return "Add marketing copy in course detail.";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function editorCourseTitle(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Course Curriculum";
  return trimmed.toLowerCase().includes("curriculum") ? trimmed : `${trimmed} Curriculum`;
}

export function filterCoursesByTab(
  courses: CurriculumProgram[],
  tab: CurriculumTabFilter
): CurriculumProgram[] {
  if (tab === "active") return courses.filter((course) => course.is_active);
  if (tab === "drafts") return courses.filter((course) => !course.is_active);
  return [];
}

export function curriculumTabCounts(courses: CurriculumProgram[]) {
  const active = courses.filter((course) => course.is_active).length;
  const drafts = courses.filter((course) => !course.is_active).length;
  return { active, drafts, archived: 0 };
}

export function impactStatChips(input: {
  authorizedCenters: number;
  activeBatches: number;
}): string[] {
  return [
    `${input.authorizedCenters.toLocaleString("en-IN")} Center${input.authorizedCenters === 1 ? "" : "s"} Authorized`,
    `${input.activeBatches.toLocaleString("en-IN")} Active Batch${input.activeBatches === 1 ? "" : "es"}`,
  ];
}

export function editorCourseDescription(name: string): string {
  const trimmed = name.trim() || "course";
  return `Marketing copy and structure for the core ${trimmed} course.`;
}

export function matchesCurriculumSearch(
  course: CurriculumProgram,
  levelNames: string[],
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [course.name, course.description, course.age_label, ...levelNames]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}
