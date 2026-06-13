import {
  fetchBrandPrograms,
  fetchCenterAuthorizedPrograms,
  syncCenterProgramEnablement,
} from "@/lib/centerProgramApi";

export { fetchBrandPrograms, fetchCenterAuthorizedPrograms, syncCenterProgramEnablement };

export async function fetchCenterAuthorizedProgramIds(centerId: string): Promise<string[]> {
  const rows = await fetchCenterAuthorizedPrograms(centerId);
  return rows.map((r) => r.programId);
}

export async function setCenterCourseAuthorized(
  centerId: string,
  _brandId: string,
  programId: string,
  enabled: boolean,
): Promise<void> {
  const authorized = await fetchCenterAuthorizedProgramIds(centerId);
  const nextIds = enabled
    ? [...new Set([...authorized, programId])]
    : authorized.filter((id) => id !== programId);
  await syncCenterProgramEnablement(centerId, nextIds);
}
