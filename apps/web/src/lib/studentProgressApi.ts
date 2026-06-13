import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError } from "@/lib/studentLearnErrors";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

export type ProgramLadderLevel = {
  level_id: string;
  name: string;
  sort_order: number;
  status: string;
  completed_at: string | null;
  abacus_level_code: string | null;
};

export type ProgramLadderAssessment = {
  id: string;
  assessment_type: string;
  score: number | null;
  max_score: number | null;
  assessed_at: string;
  notes: string | null;
};

export type ProgramLadder = {
  curriculum_version_id: string;
  program_id: string;
  program_name: string;
  curriculum_label: string;
  batches: { batch_id: string; batch_name: string; level_start: string; level_end: string }[];
  curriculum_ladder: {
    current_level_id: string | null;
    completion_pct: number;
    levels: ProgramLadderLevel[];
  };
  assessments: ProgramLadderAssessment[];
};

/** @deprecated use fetchStudentProgramLadders */
export type StudentProgressDetail = {
  curriculum_ladder: ProgramLadder["curriculum_ladder"];
  assessments: ProgramLadderAssessment[];
  level_progress: {
    level_name: string;
    status: string;
    completed_at: string | null;
    level_id: string | null;
  }[];
};

function normalizeLadders(raw: unknown): ProgramLadder[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as ProgramLadder[];
  return [];
}

export async function fetchStudentProgramLadders(brandId: string): Promise<ProgramLadder[]> {
  const { data, error } = await getSupabase().rpc("get_student_program_ladders", { p_brand_id: brandId });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
  return normalizeLadders(data);
}

export async function fetchStudentProgressDetail(brandId: string): Promise<StudentProgressDetail> {
  const ladders = await fetchStudentProgramLadders(brandId);
  const first = ladders[0];
  if (!first) {
    return {
      curriculum_ladder: { current_level_id: null, completion_pct: 0, levels: [] },
      assessments: [],
      level_progress: [],
    };
  }
  return {
    curriculum_ladder: first.curriculum_ladder,
    assessments: first.assessments,
    level_progress: first.curriculum_ladder.levels.map((l) => ({
      level_name: l.name,
      status: l.status,
      completed_at: l.completed_at,
      level_id: l.level_id,
    })),
  };
}
