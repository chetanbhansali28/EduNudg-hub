import type { CenterStatusTone } from "@edunudg/ui";
import type { BrandStudentRow } from "@/lib/brandStudentsApi";
import { studentMatchesSearch } from "@/lib/brandStudentsApi";
import { downloadTextFile } from "@/lib/platformDataExportHelpers";
import { initialsFromName } from "@/lib/welcomeMessage";

export type BrandStudentFilter = "all" | "linked" | "unassigned";

const AVATAR_TONES = ["blue", "purple", "teal", "gray"] as const;

export function studentAvatarTone(index: number): (typeof AVATAR_TONES)[number] {
  return AVATAR_TONES[index % AVATAR_TONES.length]!;
}

export function studentInitials(student: BrandStudentRow): string {
  return initialsFromName(student.full_name);
}

export function studentDirectoryMeta(student: BrandStudentRow): string {
  return [student.center_name, student.center_city].filter(Boolean).join(" · ") || student.center_slug || "Unassigned franchise";
}

export function studentStatusTone(student: BrandStudentRow): CenterStatusTone {
  if (!student.program_id) return "pending";
  return "active";
}

export function studentStatusLabel(student: BrandStudentRow): string {
  if (!student.program_id) return "UNASSIGNED";
  if (student.user_id) return "LINKED";
  return "ACTIVE";
}

export function studentPageCounts(students: BrandStudentRow[]) {
  return {
    total: students.length,
    linked: students.filter((student) => Boolean(student.user_id)).length,
    unassigned: students.filter((student) => !student.program_id).length,
  };
}

export function filterBrandStudents(
  students: BrandStudentRow[],
  filter: BrandStudentFilter,
  search: string
): BrandStudentRow[] {
  return students.filter((student) => {
    const matchesFilter =
      filter === "linked" ? Boolean(student.user_id) : filter === "unassigned" ? !student.program_id : true;
    return matchesFilter && studentMatchesSearch(student, search);
  });
}

export function formatStudentDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function levelStatusLabel(status: BrandStudentRow["levels"][number]["status"]): string {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  if (status === "failed") return "Needs retry";
  return "Not started";
}

export function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export const BRAND_STUDENTS_CSV_HEADERS = [
  "student_code",
  "student_name",
  "parent_name",
  "parent_phone",
  "parent_email",
  "login_email",
  "phone",
  "student_dob",
  "school_name",
  "address_line1",
  "city",
  "state",
  "pincode",
  "program_name",
  "starting_level",
  "current_level",
  "batches",
  "franchise_name",
  "franchise_slug",
  "franchise_city",
  "enrollment_status",
  "portal_linked",
] as const;

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** UTF-8 BOM CSV of every enrollment in the brand roster (not the current search/filter). */
export function brandStudentsToCsv(students: BrandStudentRow[]): string {
  const lines = [
    BRAND_STUDENTS_CSV_HEADERS.join(","),
    ...students.map((student) =>
      [
        student.student_code,
        student.full_name,
        student.parent_name,
        student.parent_phone,
        student.parent_email,
        student.login_email,
        student.phone,
        student.date_of_birth,
        student.school_name,
        student.address_line1,
        student.city,
        student.state,
        student.pincode,
        student.program_name,
        student.starting_level_name,
        student.current_level_name,
        student.batch_names.join("; "),
        student.center_name,
        student.center_slug,
        student.center_city,
        student.enrollment_status,
        student.user_id ? "yes" : "no",
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function brandStudentsCsvFilename(brandSlug: string, now = new Date()): string {
  const slug = brandSlug.trim() || "brand";
  return `${slug}-students-${now.toISOString().slice(0, 10)}.csv`;
}

export function downloadBrandStudentsCsv(students: BrandStudentRow[], brandSlug: string, now = new Date()): void {
  downloadTextFile(brandStudentsToCsv(students), brandStudentsCsvFilename(brandSlug, now), "text/csv;charset=utf-8");
}
