export type CenterStudentDetailTab = "enrollment" | "assessments";

export function parseCenterStudentDetailTab(value: string | null): CenterStudentDetailTab {
  return value === "assessments" ? "assessments" : "enrollment";
}
