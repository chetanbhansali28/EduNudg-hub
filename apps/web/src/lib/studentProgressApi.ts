import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError } from "@/lib/studentLearnErrors";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

export type StudentProgressDetail = {
  curriculum_ladder: {
    current_level_id: string | null;
    completion_pct: number;
    levels: {
      level_id: string;
      name: string;
      sort_order: number;
      status: string;
      completed_at: string | null;
      abacus_level_code: string | null;
    }[];
  };
  assessments: {
    id: string;
    assessment_type: string;
    score: number | null;
    max_score: number | null;
    assessed_at: string;
    notes: string | null;
  }[];
  level_progress: {
    level_name: string;
    status: string;
    completed_at: string | null;
    level_id: string | null;
  }[];
};

export async function fetchStudentProgressDetail(brandId: string): Promise<StudentProgressDetail> {
  const { data, error } = await getSupabase().rpc("get_student_progress_detail", { p_brand_id: brandId });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
  return data as StudentProgressDetail;
}
