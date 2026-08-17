import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type BrandStudentLevelRow = {
  level_id: string;
  name: string;
  sort_order: number;
  status: "completed" | "in_progress" | "failed" | "not_started";
  abacus_level_code: string | null;
  is_current: boolean;
};

export type BrandStudentRow = {
  id: string;
  enrollment_id: string;
  full_name: string;
  student_code: string | null;
  login_email: string | null;
  user_id: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  enrollment_status: string;
  enrollment_created_at: string | null;
  program_id: string | null;
  program_name: string | null;
  starting_level_id: string | null;
  starting_level_name: string | null;
  current_level_id: string | null;
  current_level_name: string | null;
  levels: BrandStudentLevelRow[];
  center_id: string;
  center_slug: string;
  center_name: string;
  center_city: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  school_name: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  batch_names: string[];
};

export type LevelCatalogRow = {
  id: string;
  name: string;
  sort_order: number;
  program_id: string;
  abacus_level_code: string | null;
};

export type StudentProgressRow = {
  student_id: string;
  level_id: string | null;
  level_name: string | null;
  status: string;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function progressStatus(
  status: string | null | undefined
): BrandStudentLevelRow["status"] {
  if (status === "completed" || status === "in_progress" || status === "failed") return status;
  return "not_started";
}

export function curriculumForStudent(
  studentId: string,
  programId: string | null,
  catalog: LevelCatalogRow[],
  progress: StudentProgressRow[]
): Pick<BrandStudentRow, "current_level_id" | "current_level_name" | "levels"> {
  if (!programId) {
    return { current_level_id: null, current_level_name: null, levels: [] };
  }

  const programLevels = catalog
    .filter((level) => level.program_id === programId)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const studentProgress = progress.filter((row) => row.student_id === studentId);

  const matchProgress = (level: LevelCatalogRow) =>
    studentProgress.find(
      (row) => row.level_id === level.id || row.level_name === level.name
    );

  const current = programLevels.find((level) => progressStatus(matchProgress(level)?.status) !== "completed") ?? null;

  const levels: BrandStudentLevelRow[] = programLevels.map((level) => {
    const isCurrent = current?.id === level.id;
    const raw = progressStatus(matchProgress(level)?.status);
    return {
      level_id: level.id,
      name: level.name,
      sort_order: level.sort_order,
      status: isCurrent && raw === "not_started" ? "in_progress" : raw,
      abacus_level_code: level.abacus_level_code,
      is_current: isCurrent,
    };
  });

  return {
    current_level_id: current?.id ?? null,
    current_level_name: current?.name ?? (programLevels.length > 0 ? "Completed" : null),
    levels,
  };
}

export function studentMatchesSearch(student: BrandStudentRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [student.full_name, student.student_code, student.center_name, student.center_city]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

type EnrollmentQueryRow = {
  id: string;
  status: string;
  created_at: string | null;
  program_id: string | null;
  starting_level_id: string | null;
  student_id: string;
  center_id: string;
  programs: { id: string; name: string } | { id: string; name: string }[] | null;
  levels: { id: string; name: string } | { id: string; name: string }[] | null;
  students: {
    id: string;
    full_name: string;
    student_code: string | null;
    login_email: string | null;
    user_id: string | null;
    date_of_birth: string | null;
    student_profiles:
      | {
          phone: string | null;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          school_name: string | null;
          photo_url: string | null;
        }
      | {
          phone: string | null;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          school_name: string | null;
          photo_url: string | null;
        }[]
      | null;
  } | null;
  franchise_centers: {
    id: string;
    name: string;
    display_name: string | null;
    slug: string;
    city: string | null;
  } | {
    id: string;
    name: string;
    display_name: string | null;
    slug: string;
    city: string | null;
  }[] | null;
};

export async function fetchBrandStudents(brandId: string): Promise<BrandStudentRow[]> {
  const sb = getSupabase();
  const { data: enrollmentData, error: enrollmentError } = await sb
    .from("student_enrollments")
    .select(
      "id, status, created_at, program_id, starting_level_id, student_id, center_id, programs(id, name), levels:starting_level_id(id, name), students(id, full_name, student_code, login_email, user_id, date_of_birth, student_profiles(phone, address_line1, city, state, pincode, school_name, photo_url)), franchise_centers(id, name, display_name, slug, city)"
    )
    .eq("brand_id", brandId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const enrollments = supabaseList(enrollmentData, enrollmentError) as unknown as EnrollmentQueryRow[];
  if (enrollments.length === 0) return [];

  const studentIds = [...new Set(enrollments.map((row) => row.students?.id ?? row.student_id))];
  const programIds = [...new Set(enrollments.map((row) => row.program_id).filter((id): id is string => Boolean(id)))];

  const [parentResult, batchResult, progressResult, levelResult] = await Promise.all([
    sb
      .from("parent_student_links")
      .select("student_id, parents(full_name, email, phone_e164)")
      .eq("brand_id", brandId)
      .in("student_id", studentIds),
    sb
      .from("batch_enrollments")
      .select("student_id, batches(name, deleted_at)")
      .eq("brand_id", brandId)
      .in("student_id", studentIds),
    sb
      .from("student_level_progress")
      .select("student_id, level_id, level_name, status")
      .eq("brand_id", brandId)
      .in("student_id", studentIds),
    programIds.length > 0
      ? sb
          .from("levels")
          .select("id, name, sort_order, program_id, abacus_level_code")
          .in("program_id", programIds)
          .order("sort_order")
      : Promise.resolve({ data: [] as LevelCatalogRow[], error: null }),
  ]);

  const parentRows = supabaseList(parentResult.data, parentResult.error) as unknown as {
    student_id: string;
    parents: { full_name: string; email: string | null; phone_e164: string | null } | { full_name: string; email: string | null; phone_e164: string | null }[] | null;
  }[];
  const batchRows = supabaseList(batchResult.data, batchResult.error) as unknown as {
    student_id: string;
    batches: { name: string; deleted_at: string | null } | null;
  }[];
  const progressRows = supabaseList(progressResult.data, progressResult.error) as unknown as StudentProgressRow[];
  const catalog = supabaseList(levelResult.data as LevelCatalogRow[] | null, levelResult.error);

  const parentMap = new Map<string, { name: string | null; email: string | null; phone: string | null }>();
  for (const row of parentRows) {
    if (parentMap.has(row.student_id)) continue;
    const parent = relationOne(row.parents);
    parentMap.set(row.student_id, {
      name: parent?.full_name ?? null,
      email: parent?.email ?? null,
      phone: parent?.phone_e164 ?? null,
    });
  }

  const batchMap = new Map<string, string[]>();
  for (const row of batchRows) {
    if (row.batches?.deleted_at) continue;
    const names = batchMap.get(row.student_id) ?? [];
    names.push(row.batches?.name ?? "Batch");
    batchMap.set(row.student_id, names);
  }

  return enrollments.map((row) => {
    const student = row.students;
    const studentId = student?.id ?? row.student_id;
    const profile = relationOne(student?.student_profiles);
    const program = relationOne(row.programs);
    const startLevel = relationOne(row.levels);
    const center = relationOne(row.franchise_centers);
    const parent = parentMap.get(studentId);
    const curriculum = curriculumForStudent(studentId, row.program_id, catalog, progressRows);

    return {
      id: studentId,
      enrollment_id: row.id,
      full_name: student?.full_name ?? "Student",
      student_code: student?.student_code ?? null,
      login_email: student?.login_email ?? null,
      user_id: student?.user_id ?? null,
      date_of_birth: student?.date_of_birth ?? null,
      photo_url: profile?.photo_url ?? null,
      enrollment_status: row.status,
      enrollment_created_at: row.created_at,
      program_id: row.program_id,
      program_name: program?.name ?? null,
      starting_level_id: row.starting_level_id,
      starting_level_name: startLevel?.name ?? null,
      current_level_id: curriculum.current_level_id,
      current_level_name: curriculum.current_level_name,
      levels: curriculum.levels,
      center_id: center?.id ?? row.center_id,
      center_slug: center?.slug ?? "",
      center_name: center?.display_name || center?.name || "Franchise",
      center_city: center?.city ?? null,
      phone: profile?.phone ?? null,
      address_line1: profile?.address_line1 ?? null,
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      pincode: profile?.pincode ?? null,
      school_name: profile?.school_name ?? null,
      parent_name: parent?.name ?? null,
      parent_email: parent?.email ?? null,
      parent_phone: parent?.phone ?? null,
      batch_names: batchMap.get(studentId) ?? [],
    };
  });
}
