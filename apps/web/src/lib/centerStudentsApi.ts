import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type CenterStudentRow = {
  id: string;
  full_name: string;
  student_code: string | null;
  login_email: string | null;
  user_id: string | null;
  enrollment_id: string;
  enrollment_status: string;
  program_id: string | null;
  program_name: string | null;
  starting_level_id: string | null;
  starting_level_name: string | null;
  batch_ids: string[];
  batch_names: string[];
};

export async function fetchCenterStudents(centerId: string, brandId: string): Promise<CenterStudentRow[]> {
  const { data: enrollments, error: eErr } = await getSupabase()
    .from("student_enrollments")
    .select(
      "id, status, program_id, starting_level_id, student_id, programs(name), levels:starting_level_id(name), students(id, full_name, student_code, login_email, user_id)"
    )
    .eq("center_id", centerId)
    .eq("brand_id", brandId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const rows = supabaseList(enrollments, eErr) as unknown as {
    id: string;
    status: string;
    program_id: string | null;
    starting_level_id: string | null;
    student_id: string;
    programs: { name: string } | { name: string }[] | null;
    levels: { name: string } | { name: string }[] | null;
    students: {
      id: string;
      full_name: string;
      student_code: string | null;
      login_email: string | null;
      user_id: string | null;
    } | null;
  }[];

  const studentIds = rows.map((r) => r.students?.id ?? r.student_id);
  if (studentIds.length === 0) return [];

  const { data: batchRows, error: bErr } = await getSupabase()
    .from("batch_enrollments")
    .select("student_id, batch_id, batches(name, deleted_at)")
    .eq("center_id", centerId)
    .in("student_id", studentIds);
  const batches = supabaseList(batchRows, bErr) as unknown as {
    student_id: string;
    batch_id: string;
    batches: { name: string; deleted_at: string | null } | null;
  }[];

  const batchMap = new Map<string, { ids: string[]; names: string[] }>();
  for (const b of batches) {
    if (b.batches?.deleted_at) continue;
    const entry = batchMap.get(b.student_id) ?? { ids: [], names: [] };
    entry.ids.push(b.batch_id);
    entry.names.push(b.batches?.name ?? "Batch");
    batchMap.set(b.student_id, entry);
  }

  return rows.map((r) => {
    const sid = r.students?.id ?? r.student_id;
    const batchInfo = batchMap.get(sid) ?? { ids: [], names: [] };
    const program = Array.isArray(r.programs) ? r.programs[0] : r.programs;
    const startLevel = Array.isArray(r.levels) ? r.levels[0] : r.levels;
    return {
      id: sid,
      full_name: r.students?.full_name ?? "Student",
      student_code: r.students?.student_code ?? null,
      login_email: r.students?.login_email ?? null,
      user_id: r.students?.user_id ?? null,
      enrollment_id: r.id,
      enrollment_status: r.status,
      program_id: r.program_id,
      program_name: program?.name ?? null,
      starting_level_id: r.starting_level_id,
      starting_level_name: startLevel?.name ?? null,
      batch_ids: batchInfo.ids,
      batch_names: batchInfo.names,
    };
  });
}

export async function syncStudentBatchAssignments(
  studentId: string,
  centerId: string,
  batchIds: string[]
): Promise<void> {
  const { error } = await getSupabase().rpc("sync_student_batch_assignments", {
    p_student_id: studentId,
    p_center_id: centerId,
    p_batch_ids: batchIds,
  });
  if (error) throw error;
}
