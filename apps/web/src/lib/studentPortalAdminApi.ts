import { getSupabase } from "@/lib/supabase";

export async function inviteStudentPortalAccess(studentId: string, loginEmail: string): Promise<void> {
  const { error } = await getSupabase().rpc("invite_student_portal_access", {
    p_student_id: studentId,
    p_login_email: loginEmail.trim(),
  });
  if (error) throw error;
}

export async function pinEnrollmentProgram(
  enrollmentId: string,
  programId: string,
  startLevelId?: string | null
): Promise<void> {
  const { error } = await getSupabase().rpc("pin_enrollment_program", {
    p_enrollment_id: enrollmentId,
    p_program_id: programId,
    p_start_level_id: startLevelId ?? null,
  });
  if (error) throw error;
}
