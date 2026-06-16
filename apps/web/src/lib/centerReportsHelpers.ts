import type { StudentAssessmentRow } from "@/lib/centerAssessmentsApi";
import type { CenterOpsReport } from "@/lib/centerReportsApi";

export type ReportAssessmentStatus = {
  label: string;
  tone: "success" | "warning";
};

export function pipelineLeadTotal(openLeads: number, convertedLeads: number): number {
  return openLeads + convertedLeads;
}

export function pipelineConversionPercent(openLeads: number, convertedLeads: number): number {
  const total = pipelineLeadTotal(openLeads, convertedLeads);
  if (total <= 0) return 0;
  return Math.round((convertedLeads / total) * 100);
}

export function reportDesktopSubtitle(): string {
  return "Monitor your center's operational health and student progress.";
}

export function reportMobileSubtitle(centerName: string | null, centerId: string | null): string {
  const name = centerName?.trim() || "Your center";
  const id = centerId ? centerId.replace(/-/g, "").slice(0, 5).toUpperCase() : "—";
  return `${name} • ID: ${id}`;
}

export function reportQuarterLabel(date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function formatReportDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function assessmentLevelLabel(row: StudentAssessmentRow): string {
  const level = relationName(row.levels);
  if (level) return level;
  const program = relationName(row.programs);
  if (program) return program;
  return row.assessment_type.replace(/_/g, " ");
}

export function reportAssessmentStatus(
  passed: boolean | null | undefined,
  score: number | null,
  maxScore: number | null
): ReportAssessmentStatus {
  if (passed === true) return { label: "Passed", tone: "success" };
  if (passed === false) return { label: "Needs Review", tone: "warning" };
  if (score != null && maxScore != null && maxScore > 0) {
    return score / maxScore >= 0.7
      ? { label: "Passed", tone: "success" }
      : { label: "Needs Review", tone: "warning" };
  }
  return { label: "Needs Review", tone: "warning" };
}

export function formatAssessmentScore(score: number | null, maxScore: number | null): string {
  if (score == null) return "—";
  if (maxScore == null) return String(score);
  return `${score}/${maxScore}`;
}

export function assessmentVelocityHint(count: number): string {
  if (count <= 0) return "No assessments in the last 30 days";
  if (count >= 4) return "Maintaining target cadence";
  return "Record more assessments to stay on track";
}

export function enrollmentHealthHint(activeEnrollments: number): string {
  if (activeEnrollments <= 0) return "No active enrollments yet";
  return `${activeEnrollments} active student${activeEnrollments === 1 ? "" : "s"} enrolled`;
}

export function sortAssessmentsNewestFirst(rows: StudentAssessmentRow[]): StudentAssessmentRow[] {
  return [...rows].sort(
    (a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
  );
}

export function mergeReportSummary(report: CenterOpsReport | undefined) {
  return {
    openLeads: report?.open_leads ?? 0,
    convertedLeads: report?.converted_leads ?? 0,
    activeEnrollments: report?.active_enrollments ?? 0,
    assessments30d: report?.assessments_30d ?? 0,
  };
}

function relationName(value: { name: string } | { name: string }[] | null | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

export function studentDisplayName(row: StudentAssessmentRow): string {
  const rel = row.students;
  if (!rel) return "Student";
  if (Array.isArray(rel)) return rel[0]?.full_name ?? "Student";
  return rel.full_name;
}
