import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type CenterBatchRow = {
  id: string;
  name: string;
  is_open_for_enrollment: boolean;
  program_id: string | null;
  level_start_id: string | null;
  level_end_id: string | null;
  schedule: Record<string, unknown> | null;
  programs: { name: string } | { name: string }[] | null;
  level_start: { name: string } | null;
  level_end: { name: string } | null;
};

export type UpsertBatchInput = {
  batchId?: string | null;
  centerId: string;
  name: string;
  programId: string;
  levelStartId: string;
  levelEndId: string;
  isOpenForEnrollment?: boolean;
};

export async function fetchCenterBatches(centerId: string): Promise<CenterBatchRow[]> {
  const { data, error } = await getSupabase()
    .from("batches")
    .select(
      "id, name, is_open_for_enrollment, program_id, level_start_id, level_end_id, schedule, programs(name), level_start:levels!batches_level_start_id_fkey(name), level_end:levels!batches_level_end_id_fkey(name)"
    )
    .eq("center_id", centerId)
    .is("deleted_at", null)
    .order("name");
  return supabaseList(data, error) as unknown as CenterBatchRow[];
}

export async function fetchAuthorizedPrograms(centerId: string, brandId: string) {
  const { data: auth, error: authErr } = await getSupabase()
    .from("center_program_enablement")
    .select("program_id")
    .eq("center_id", centerId);
  const programIds = supabaseList(auth, authErr).map((r) => r.program_id as string);
  if (programIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("programs")
    .select("id, name")
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("id", programIds)
    .order("name");
  return supabaseList(data, error) as { id: string; name: string }[];
}

export async function upsertCenterBatch(input: UpsertBatchInput): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_center_batch", {
    p_batch_id: input.batchId ?? null,
    p_center_id: input.centerId,
    p_name: input.name.trim(),
    p_program_id: input.programId,
    p_level_start_id: input.levelStartId,
    p_level_end_id: input.levelEndId,
    p_is_open_for_enrollment: input.isOpenForEnrollment ?? false,
    p_schedule: {},
  });
  if (error) throw error;
  return data as string;
}

export async function softDeleteCenterBatch(batchId: string): Promise<void> {
  const { error } = await getSupabase().rpc("soft_delete_center_batch", { p_batch_id: batchId });
  if (error) throw error;
}

export async function getCenterUnseenBatchJoins(centerId: string): Promise<number> {
  const { data, error } = await getSupabase().rpc("get_center_unseen_batch_joins", {
    p_center_id: centerId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function markBatchJoinsSeen(centerId: string): Promise<void> {
  const { error } = await getSupabase().rpc("mark_batch_joins_seen", { p_center_id: centerId });
  if (error) throw error;
}
