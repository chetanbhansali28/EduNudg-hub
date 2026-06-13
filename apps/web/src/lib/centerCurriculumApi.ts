import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type PublishedCurriculumVersion = {
  id: string;
  version_number: number;
  program_id: string;
  program_name: string;
};

export type CurriculumVersionsByProgram = {
  programId: string;
  programName: string;
  versions: PublishedCurriculumVersion[];
};

export async function fetchBrandPublishedCurriculumVersions(
  brandId: string
): Promise<PublishedCurriculumVersion[]> {
  const { data, error } = await getSupabase()
    .from("curriculum_versions")
    .select("id, version_number, program_id, programs(name)")
    .eq("brand_id", brandId)
    .eq("status", "published")
    .order("version_number", { ascending: false });
  const rows = supabaseList(data, error) as {
    id: string;
    version_number: number;
    program_id: string;
    programs: { name: string } | { name: string }[] | null;
  }[];
  return rows.map((r) => {
    const program = Array.isArray(r.programs) ? r.programs[0] : r.programs;
    return {
      id: r.id,
      version_number: r.version_number,
      program_id: r.program_id,
      program_name: program?.name ?? "Program",
    };
  });
}

export function groupCurriculumVersionsByProgram(
  versions: PublishedCurriculumVersion[]
): CurriculumVersionsByProgram[] {
  const map = new Map<string, CurriculumVersionsByProgram>();
  for (const v of versions) {
    let group = map.get(v.program_id);
    if (!group) {
      group = { programId: v.program_id, programName: v.program_name, versions: [] };
      map.set(v.program_id, group);
    }
    group.versions.push(v);
  }
  return [...map.values()].sort((a, b) => a.programName.localeCompare(b.programName));
}

export function latestPublishedVersionByProgram(
  versions: PublishedCurriculumVersion[]
): Map<string, PublishedCurriculumVersion> {
  const map = new Map<string, PublishedCurriculumVersion>();
  for (const v of versions) {
    const current = map.get(v.program_id);
    if (!current || v.version_number > current.version_number) {
      map.set(v.program_id, v);
    }
  }
  return map;
}

export async function fetchCenterAuthorizedCurriculumVersionIds(centerId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("center_curriculum_enablement")
    .select("curriculum_version_id")
    .eq("center_id", centerId);
  return supabaseList(data, error).map((r) => r.curriculum_version_id as string);
}

export async function syncCenterCurriculumEnablement(
  centerId: string,
  curriculumVersionIds: string[]
): Promise<void> {
  const { error } = await getSupabase().rpc("sync_center_curriculum_enablement", {
    p_center_id: centerId,
    p_curriculum_version_ids: curriculumVersionIds,
  });
  if (error) throw error;
}

export async function setCenterCourseAuthorized(
  centerId: string,
  brandId: string,
  programId: string,
  enabled: boolean
): Promise<void> {
  const [published, authorizedVersionIds] = await Promise.all([
    fetchBrandPublishedCurriculumVersions(brandId),
    fetchCenterAuthorizedCurriculumVersionIds(centerId),
  ]);

  const programVersionIds = new Set(
    published.filter((v) => v.program_id === programId).map((v) => v.id)
  );

  let nextIds: string[];
  if (enabled) {
    const latest = [...programVersionIds]
      .map((id) => published.find((v) => v.id === id))
      .filter((v): v is PublishedCurriculumVersion => !!v)
      .sort((a, b) => b.version_number - a.version_number)[0];
    if (!latest) {
      throw new Error("NO_PUBLISHED_CURRICULUM");
    }
    nextIds = [...new Set([...authorizedVersionIds, latest.id])];
  } else {
    nextIds = authorizedVersionIds.filter((id) => !programVersionIds.has(id));
  }

  await syncCenterCurriculumEnablement(centerId, nextIds);
}
