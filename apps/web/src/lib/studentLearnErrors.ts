export type StudentLearnErrorCode =
  | "NO_ACTIVE_ENROLLMENT"
  | "NO_STUDENT_LINK"
  | "REGISTRATION_CLOSED"
  | "PAID_ENROLLMENT_NOT_AVAILABLE";

/** Collect all string fragments PostgREST / Supabase may put error codes in. */
export function studentLearnErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "");
  const e = error as Record<string, unknown>;
  const parts = [e.message, e.details, e.hint, e.code]
    .filter((v) => v != null && String(v).length > 0)
    .map(String);
  return parts.join(" ");
}

export function parseStudentLearnError(error: unknown): StudentLearnErrorCode | null {
  const message = studentLearnErrorText(error);
  if (message.includes("NO_ACTIVE_ENROLLMENT")) return "NO_ACTIVE_ENROLLMENT";
  if (message.includes("NO_STUDENT_LINK")) return "NO_STUDENT_LINK";
  if (message.includes("REGISTRATION_CLOSED")) return "REGISTRATION_CLOSED";
  if (message.includes("PAID_ENROLLMENT_NOT_AVAILABLE")) return "PAID_ENROLLMENT_NOT_AVAILABLE";
  return null;
}

export function studentProgressEmptyMessage(ladderCount: number): string | null {
  if (ladderCount > 0) return null;
  return "No program progress yet. Join an open batch from your dashboard, or ask your center to assign you to a batch and curriculum.";
}

export function studentProgressErrorMessage(error: unknown): string {
  const code = parseStudentLearnError(error);
  if (code === "NO_ACTIVE_ENROLLMENT") {
    return "You need an active center enrollment before progress can be shown.";
  }
  if (code === "NO_STUDENT_LINK") {
    return "Your login is not linked to a student record yet. Contact your center.";
  }
  const text = studentLearnErrorText(error);
  if (text.includes("does not exist") || text.includes("Bad Request")) {
    return "Progress is temporarily unavailable. Please try again in a moment or contact your center.";
  }
  return text || "Unable to load progress right now.";
}

/** Learn portal queries should not retry RPC failures (avoids console spam). */
export function shouldRetryStudentLearnQuery(_count: number, error: unknown): boolean {
  if (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "StudentLearnRpcError") {
    return false;
  }
  const code = parseStudentLearnError(error);
  if (code) return false;
  return false;
}
