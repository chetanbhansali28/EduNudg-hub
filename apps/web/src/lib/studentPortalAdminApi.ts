import { getSupabase } from "@/lib/supabase";

export async function inviteStudentPortalAccess(studentId: string, loginEmail: string): Promise<void> {
  const { error } = await getSupabase().rpc("invite_student_portal_access", {
    p_student_id: studentId,
    p_login_email: loginEmail.trim(),
  });
  if (error) throw error;
}

export async function pinEnrollmentCurriculum(
  enrollmentId: string,
  curriculumVersionId: string
): Promise<void> {
  const { error } = await getSupabase().rpc("pin_enrollment_curriculum", {
    p_enrollment_id: enrollmentId,
    p_curriculum_version_id: curriculumVersionId,
  });
  if (error) throw error;
}
