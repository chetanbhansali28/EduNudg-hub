import { getSupabase } from "@/lib/supabase";
import { parseStudentLearnError } from "@/lib/studentLearnErrors";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

export type OpenBatchRow = {
  batch_id: string;
  name: string;
  program_name: string;
  level_start: string;
  level_end: string;
  already_joined: boolean;
};

export async function fetchStudentOpenBatches(brandId: string): Promise<OpenBatchRow[]> {
  const { data, error } = await getSupabase().rpc("get_student_open_batches", { p_brand_id: brandId });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    throw error;
  }
  return (data ?? []) as OpenBatchRow[];
}

export async function joinStudentBatch(batchId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("join_student_batch", { p_batch_id: batchId });
  if (error) {
    const code = parseStudentLearnError(error);
    if (code) throw new StudentLearnRpcError(code, error.message);
    if (error.message.includes("BATCH_NOT_OPEN")) {
      throw new StudentLearnRpcError("REGISTRATION_CLOSED", error.message);
    }
    throw error;
  }
  return data as string;
}
