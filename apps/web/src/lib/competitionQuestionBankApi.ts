import { getSupabase } from "@/lib/supabase";

export type BankQuestionOption = {
  id?: string;
  text: string;
  is_correct: boolean;
  sort_order?: number;
};

export type BankQuestion = {
  id: string;
  program_id: string;
  level_id: string;
  prompt: string;
  explanation: string | null;
  is_active: boolean;
  options: BankQuestionOption[];
};

export type AttachedCompetitionQuestion = {
  id: string;
  bank_question_id: string | null;
  sort_order: number;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
};

export async function listCompetitionBankQuestions(
  brandId: string,
  programId?: string,
  levelId?: string
): Promise<BankQuestion[]> {
  const { data, error } = await getSupabase().rpc("list_competition_bank_questions", {
    p_brand_id: brandId,
    p_program_id: programId ?? null,
    p_level_id: levelId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as BankQuestion[];
}

export async function upsertCompetitionBankQuestion(
  brandId: string,
  input: {
    id?: string;
    programId: string;
    levelId: string;
    prompt: string;
    explanation?: string;
    isActive?: boolean;
    options: { text: string; is_correct: boolean }[];
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_competition_bank_question", {
    p_brand_id: brandId,
    p_program_id: input.programId,
    p_level_id: input.levelId,
    p_prompt: input.prompt,
    p_options: input.options,
    p_id: input.id ?? null,
    p_explanation: input.explanation ?? null,
    p_is_active: input.isActive ?? true,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteCompetitionBankQuestion(brandId: string, id: string): Promise<void> {
  const { error } = await getSupabase().rpc("delete_competition_bank_question", {
    p_brand_id: brandId,
    p_id: id,
  });
  if (error) throw error;
}

export async function listBrandCompetitionQuestions(
  brandId: string,
  competitionId: string
): Promise<AttachedCompetitionQuestion[]> {
  const { data, error } = await getSupabase().rpc("list_brand_competition_questions", {
    p_brand_id: brandId,
    p_competition_id: competitionId,
  });
  if (error) throw error;
  return (data ?? []) as AttachedCompetitionQuestion[];
}

export async function setBrandCompetitionQuestions(
  brandId: string,
  competitionId: string,
  bankQuestionIds: string[]
): Promise<void> {
  const { error } = await getSupabase().rpc("set_brand_competition_questions", {
    p_brand_id: brandId,
    p_competition_id: competitionId,
    p_bank_question_ids: bankQuestionIds,
  });
  if (error) throw error;
}

export async function addRandomCompetitionQuestions(
  brandId: string,
  competitionId: string,
  programId: string,
  levelId: string,
  count: number
): Promise<number> {
  const { data, error } = await getSupabase().rpc("add_random_competition_questions", {
    p_brand_id: brandId,
    p_competition_id: competitionId,
    p_program_id: programId,
    p_level_id: levelId,
    p_count: count,
  });
  if (error) throw error;
  return data as number;
}
