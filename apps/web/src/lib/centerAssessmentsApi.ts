import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type StudentAssessmentRow = {
  id: string;
  student_id: string;
  assessment_type: string;
  score: number | null;
  max_score: number | null;
  assessed_at: string;
  notes: string | null;
  passed: boolean | null;
  level_id: string | null;
  program_id: string | null;
  students?: { full_name: string } | { full_name: string }[] | null;
  levels?: { name: string } | { name: string }[] | null;
  programs?: { name: string } | { name: string }[] | null;
};

const ASSESSMENT_SELECT =
  "id, student_id, assessment_type, score, max_score, assessed_at, notes, passed, level_id, program_id, students(full_name), levels(name), programs(name)";

export async function listCenterAssessments(centerId: string): Promise<StudentAssessmentRow[]> {
  const { data, error } = await getSupabase()
    .from("student_assessments")
    .select(ASSESSMENT_SELECT)
    .eq("center_id", centerId)
    .order("assessed_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return supabaseList(data, null) as StudentAssessmentRow[];
}

export async function listStudentAssessments(
  centerId: string,
  studentId: string
): Promise<StudentAssessmentRow[]> {
  const { data, error } = await getSupabase()
    .from("student_assessments")
    .select(ASSESSMENT_SELECT)
    .eq("center_id", centerId)
    .eq("student_id", studentId)
    .order("assessed_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return supabaseList(data, null) as StudentAssessmentRow[];
}

export async function recordStudentAssessment(
  centerId: string,
  input: {
    studentId: string;
    assessmentType: string;
    score?: number;
    maxScore?: number;
    assessedAt?: string;
    notes?: string;
    levelId?: string;
    passed?: boolean;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("record_student_assessment", {
    p_center_id: centerId,
    p_student_id: input.studentId,
    p_assessment_type: input.assessmentType.trim(),
    p_score: input.score ?? null,
    p_max_score: input.maxScore ?? null,
    p_assessed_at: input.assessedAt || null,
    p_notes: input.notes?.trim() || null,
    p_visible_to_student: true,
    p_level_id: input.levelId ?? null,
    p_passed: input.passed ?? null,
  });
  if (error) throw error;
  return data as string;
}
