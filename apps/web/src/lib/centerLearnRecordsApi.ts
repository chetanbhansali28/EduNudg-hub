import { getSupabase } from "@/lib/supabase";

export async function recordStudentLevelProgress(
  centerId: string,
  studentId: string,
  levelName: string,
  status: string,
  levelId?: string | null
): Promise<string> {
  const { data, error } = await getSupabase().rpc("record_student_level_progress", {
    p_center_id: centerId,
    p_student_id: studentId,
    p_level_name: levelName.trim(),
    p_status: status,
    p_level_id: levelId ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function recordStudentCompetitionEntry(
  centerId: string,
  studentId: string,
  competitionId: string,
  resultRank?: string
): Promise<string> {
  const { data, error } = await getSupabase().rpc("record_student_competition_entry", {
    p_center_id: centerId,
    p_student_id: studentId,
    p_competition_id: competitionId,
    p_result_rank: resultRank?.trim() || null,
  });
  if (error) throw error;
  return data as string;
}
