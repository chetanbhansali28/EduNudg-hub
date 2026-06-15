import type { CenterStudentProgramContext } from "./centerStudentProgramApi";
import type { StudentAssessmentRow } from "./centerAssessmentsApi";

export type ProgramLevelOption = {
  level_id: string;
  label: string;
  sort_order: number;
};

export type UnrecordedProgramLevel = ProgramLevelOption;

export function programLevelsForAssessment(ctx: CenterStudentProgramContext): ProgramLevelOption[] {
  return (ctx.levels ?? [])
    .map((level) => ({
      level_id: level.level_id,
      label: ctx.program_name
        ? `${ctx.program_name} · ${level.name}${
            level.abacus_level_code ? ` (${level.abacus_level_code})` : ""
          }`
        : level.name,
      sort_order: level.sort_order,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function unrecordedProgramLevels(
  ctx: CenterStudentProgramContext,
  assessments: StudentAssessmentRow[]
): UnrecordedProgramLevel[] {
  const recorded = new Set(assessments.map((row) => row.level_id).filter(Boolean));
  return programLevelsForAssessment(ctx).filter((level) => !recorded.has(level.level_id));
}

export function latestAssessmentForLevel(
  assessments: StudentAssessmentRow[],
  levelId: string
): StudentAssessmentRow | null {
  return assessments.find((row) => row.level_id === levelId) ?? null;
}

export function assessmentStudentName(row: StudentAssessmentRow): string {
  const student = Array.isArray(row.students) ? row.students[0] : row.students;
  return student?.full_name ?? "Student";
}

export function assessmentLevelName(row: StudentAssessmentRow): string {
  const level = Array.isArray(row.levels) ? row.levels[0] : row.levels;
  return level?.name ?? "Level";
}

export function assessmentProgramName(row: StudentAssessmentRow): string {
  const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
  return program?.name ?? "Program";
}

export function passFailLabel(passed: boolean | null | undefined): string {
  if (passed === true) return "Pass";
  if (passed === false) return "Fail";
  return "Pending";
}

export function formatAssessmentDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function assessmentScoreLabel(row: StudentAssessmentRow): string {
  if (row.score == null) return "No score recorded";
  return row.max_score != null ? `${row.score} / ${row.max_score}` : `${row.score}`;
}

export function matchesAssessmentSearch(row: StudentAssessmentRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    assessmentStudentName(row),
    row.assessment_type,
    assessmentProgramName(row),
    assessmentLevelName(row),
    row.notes,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

export type AssessmentResultFilter = "all" | "pass" | "fail";

export function matchesAssessmentFilter(row: StudentAssessmentRow, filter: AssessmentResultFilter): boolean {
  if (filter === "pass") return row.passed === true;
  if (filter === "fail") return row.passed === false;
  return true;
}
