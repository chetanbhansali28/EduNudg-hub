export type StudentLearnErrorCode =
  | "NO_ACTIVE_ENROLLMENT"
  | "NO_STUDENT_LINK"
  | "REGISTRATION_CLOSED"
  | "PAID_ENROLLMENT_NOT_AVAILABLE";

export function parseStudentLearnError(error: unknown): StudentLearnErrorCode | null {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : String(error ?? "");
  if (message.includes("NO_ACTIVE_ENROLLMENT")) return "NO_ACTIVE_ENROLLMENT";
  if (message.includes("NO_STUDENT_LINK")) return "NO_STUDENT_LINK";
  if (message.includes("REGISTRATION_CLOSED")) return "REGISTRATION_CLOSED";
  if (message.includes("PAID_ENROLLMENT_NOT_AVAILABLE")) return "PAID_ENROLLMENT_NOT_AVAILABLE";
  return null;
}
