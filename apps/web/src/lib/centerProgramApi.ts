import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type CenterProgramAuth = {
  centerId: string;
  programId: string;
  programName: string;
  authorizedAt: string;
};

export async function fetchBrandPrograms(brandId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await getSupabase()
    .from("programs")
    .select("id, name")
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .order("name");
  return supabaseList(data, error);
}

export async function fetchCenterAuthorizedPrograms(centerId: string): Promise<CenterProgramAuth[]> {
  const { data, error } = await getSupabase()
    .from("center_program_enablement")
    .select("center_id, program_id, authorized_at, programs(name)")
    .eq("center_id", centerId);
  const rows = supabaseList(data, error) as {
    center_id: string;
    program_id: string;
    authorized_at: string;
    programs: { name: string } | { name: string }[] | null;
  }[];
  return rows.map((r) => {
    const program = Array.isArray(r.programs) ? r.programs[0] : r.programs;
    return {
      centerId: r.center_id,
      programId: r.program_id,
      programName: program?.name ?? "Program",
      authorizedAt: r.authorized_at,
    };
  });
}

export async function syncCenterProgramEnablement(centerId: string, programIds: string[]): Promise<void> {
  const { error } = await getSupabase().rpc("sync_center_program_enablement", {
    p_center_id: centerId,
    p_program_ids: programIds,
  });
  if (error) throw error;
}
