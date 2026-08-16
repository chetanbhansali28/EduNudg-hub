import type { CenterStudentRow } from "@/lib/centerStudentsApi";

export type StudentTabFilter = "all" | "linked" | "unassigned";

export type StudentPageCounts = {
  linked: number;
  unassigned: number;
  programs: number;
  total: number;
};

export function studentProgramLabel(student: CenterStudentRow): string {
  if (!student.program_name) return "Not assigned";
  return student.starting_level_name
    ? `${student.program_name} · ${student.starting_level_name}`
    : student.program_name;
}

export function studentPageCounts(students: CenterStudentRow[]): StudentPageCounts {
  return {
    linked: students.filter((student) => Boolean(student.user_id)).length,
    unassigned: students.filter((student) => student.batch_ids.length === 0).length,
    programs: students.filter((student) => Boolean(student.program_id)).length,
    total: students.length,
  };
}

export function matchesStudentSearch(student: CenterStudentRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [student.full_name, student.student_code, student.login_email]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

export function filterCenterStudents(
  students: CenterStudentRow[],
  filter: StudentTabFilter,
  search: string
): CenterStudentRow[] {
  return students.filter((student) => {
    const matchesFilter =
      filter === "linked"
        ? Boolean(student.user_id)
        : filter === "unassigned"
          ? student.batch_ids.length === 0
          : true;
    return matchesFilter && matchesStudentSearch(student, search);
  });
}
