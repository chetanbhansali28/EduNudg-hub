import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError } from "@/lib/studentLearnErrors";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

export type QuizOption = { id: string; text: string };

export type QuizQuestion = {
  id: string;
  sort_order: number;
  prompt: string;
  options: QuizOption[];
};

export type QuizReviewRow = {
  competition_question_id: string;
  selected_option_ids: string[];
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string | null;
};

export type StudentCompetitionQuiz = {
  competition_id: string;
  name: string;
  questions: QuizQuestion[];
  attempt_status: "none" | "in_progress" | "submitted";
  score: number | null;
  max_score: number | null;
  review: QuizReviewRow[];
};

function throwLearn(error: unknown): never {
  const code = parseStudentLearnError(error);
  if (code) throw new StudentLearnRpcError(code, error instanceof Error ? error.message : String(error));
  throw error;
}

export async function fetchStudentCompetitionQuiz(competitionId: string): Promise<StudentCompetitionQuiz> {
  const { data, error } = await getSupabase().rpc("get_student_competition_quiz", {
    p_competition_id: competitionId,
  });
  if (error) throwLearn(error);
  return data as StudentCompetitionQuiz;
}

export async function startCompetitionAttempt(competitionId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("start_competition_attempt", {
    p_competition_id: competitionId,
  });
  if (error) throwLearn(error);
  return data as string;
}

export async function submitCompetitionAttempt(
  competitionId: string,
  answers: { competition_question_id: string; selected_option_ids: string[] }[]
): Promise<{ score: number; max_score: number; attempt_id: string }> {
  const { data, error } = await getSupabase().rpc("submit_competition_attempt", {
    p_competition_id: competitionId,
    p_answers: answers,
  });
  if (error) throwLearn(error);
  return data as { score: number; max_score: number; attempt_id: string };
}
