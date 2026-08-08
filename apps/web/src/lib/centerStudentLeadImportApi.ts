import { getSupabase } from "@/lib/supabase";
import type { CenterStudentLeadImportRpcRow } from "@/lib/centerStudentLeadImportHelpers";

export type CenterStudentLeadImportResult = {
  created: Array<{ row: number; lead_id: string }>;
  merged: Array<{ row: number; lead_id: string }>;
  errors: Array<{ row: number; message: string }>;
};

export type BulkConvertCenterLeadsResult = {
  converted: Array<{ lead_id: string; student_id: string }>;
  errors: Array<{ lead_id: string; message: string }>;
};

export async function importCenterStudentLeads(
  centerId: string,
  rows: CenterStudentLeadImportRpcRow[]
): Promise<{ result: CenterStudentLeadImportResult | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("import_center_student_leads", {
    p_center_id: centerId,
    p_rows: rows,
  });

  if (error) return { result: null, error: error.message };

  const payload = data as CenterStudentLeadImportResult | null;
  return {
    result: {
      created: payload?.created ?? [],
      merged: payload?.merged ?? [],
      errors: payload?.errors ?? [],
    },
    error: null,
  };
}

export async function bulkConvertCenterLeads(
  centerId: string,
  leadIds?: string[]
): Promise<{ result: BulkConvertCenterLeadsResult | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("bulk_convert_center_leads", {
    p_center_id: centerId,
    p_lead_ids: leadIds ?? null,
  });

  if (error) return { result: null, error: error.message };

  const payload = data as BulkConvertCenterLeadsResult | null;
  return {
    result: {
      converted: payload?.converted ?? [],
      errors: payload?.errors ?? [],
    },
    error: null,
  };
}
