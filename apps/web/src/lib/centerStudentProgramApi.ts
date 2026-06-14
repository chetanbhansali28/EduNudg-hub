import { getSupabase } from "@/lib/supabase";

export type CenterStudentProgramContext = {
  enrollment_id: string;
  program_id: string | null;
  program_name: string | null;
  starting_level_id: string | null;
  starting_level_name: string | null;
  current_level_id: string | null;
  current_level_name: string | null;
  levels: {
    level_id: string;
    name: string;
    sort_order: number;
    status: string;
    abacus_level_code: string | null;
  }[];
};

export async function fetchCenterStudentProgramContext(
  centerId: string,
  studentId: string
): Promise<CenterStudentProgramContext> {
  const { data, error } = await getSupabase().rpc("get_center_student_program_context", {
    p_center_id: centerId,
    p_student_id: studentId,
  });
  if (error) throw error;
  return data as CenterStudentProgramContext;
}
