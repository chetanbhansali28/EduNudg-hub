import { getSupabase } from "@/lib/supabase";
import type { CenterStudentImportRpcRow } from "@/lib/centerStudentImportHelpers";

export type CenterStudentImportResult = {
  created: Array<{ row: number; student_id: string }>;
  skipped: Array<{ row: number; student_id?: string; message: string }>;
  errors: Array<{ row: number; message: string }>;
};

export async function importCenterStudents(
  centerId: string,
  rows: CenterStudentImportRpcRow[]
): Promise<{ result: CenterStudentImportResult | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("import_center_students", {
    p_center_id: centerId,
    p_rows: rows,
  });

  if (error) return { result: null, error: error.message };

  const payload = data as CenterStudentImportResult | null;
  return {
    result: {
      created: payload?.created ?? [],
      skipped: payload?.skipped ?? [],
      errors: payload?.errors ?? [],
    },
    error: null,
  };
}
