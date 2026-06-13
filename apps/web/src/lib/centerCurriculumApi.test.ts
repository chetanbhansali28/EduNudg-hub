import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  groupCurriculumVersionsByProgram,
  latestPublishedVersionByProgram,
  setCenterCourseAuthorized,
  syncCenterCurriculumEnablement,
} from "./centerCurriculumApi";

const rpc = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc }),
}));

function chain(data: unknown) {
  const result = { data, error: null };
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    order: vi.fn(() => api),
    then: (resolve: (v: typeof result) => void) => resolve(result),
  };
  return api;
}

describe("centerCurriculumApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromMock.mockReset();
  });

  it("syncCenterCurriculumEnablement calls RPC with version ids", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await syncCenterCurriculumEnablement("center-1", ["ver-a", "ver-b"]);
    expect(rpc).toHaveBeenCalledWith("sync_center_curriculum_enablement", {
      p_center_id: "center-1",
      p_curriculum_version_ids: ["ver-a", "ver-b"],
    });
  });

  it("groupCurriculumVersionsByProgram groups by program", () => {
    const grouped = groupCurriculumVersionsByProgram([
      { id: "v1", version_number: 2, program_id: "p1", program_name: "Abacus" },
      { id: "v2", version_number: 1, program_id: "p1", program_name: "Abacus" },
      { id: "v3", version_number: 1, program_id: "p2", program_name: "Vedic" },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].programName).toBe("Abacus");
    expect(grouped[0].versions).toHaveLength(2);
  });

  it("latestPublishedVersionByProgram picks highest version per program", () => {
    const map = latestPublishedVersionByProgram([
      { id: "v1", version_number: 2, program_id: "p1", program_name: "Abacus" },
      { id: "v2", version_number: 1, program_id: "p1", program_name: "Abacus" },
    ]);
    expect(map.get("p1")?.id).toBe("v1");
  });

  it("setCenterCourseAuthorized enables latest published version", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "curriculum_versions") {
        return chain([
          { id: "v2", version_number: 2, program_id: "p1", programs: { name: "Abacus" } },
          { id: "v1", version_number: 1, program_id: "p1", programs: { name: "Abacus" } },
        ]);
      }
      if (table === "center_curriculum_enablement") {
        return chain([]);
      }
      return chain([]);
    });
    rpc.mockResolvedValue({ data: null, error: null });

    await setCenterCourseAuthorized("center-1", "brand-1", "p1", true);

    expect(rpc).toHaveBeenCalledWith("sync_center_curriculum_enablement", {
      p_center_id: "center-1",
      p_curriculum_version_ids: ["v2"],
    });
  });

  it("setCenterCourseAuthorized disables all versions for program", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "curriculum_versions") {
        return chain([
          { id: "v2", version_number: 2, program_id: "p1", programs: { name: "Abacus" } },
        ]);
      }
      if (table === "center_curriculum_enablement") {
        return chain([{ curriculum_version_id: "v2" }]);
      }
      return chain([]);
    });
    rpc.mockResolvedValue({ data: null, error: null });

    await setCenterCourseAuthorized("center-1", "brand-1", "p1", false);

    expect(rpc).toHaveBeenCalledWith("sync_center_curriculum_enablement", {
      p_center_id: "center-1",
      p_curriculum_version_ids: [],
    });
  });
});
