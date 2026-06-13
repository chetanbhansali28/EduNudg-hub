import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchCenterAuthorizedProgramIds,
  setCenterCourseAuthorized,
} from "./centerCurriculumApi";

const rpc = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc }),
}));

vi.mock("@/lib/centerProgramApi", () => ({
  fetchBrandPrograms: vi.fn(),
  fetchCenterAuthorizedPrograms: vi.fn(),
  syncCenterProgramEnablement: vi.fn(),
}));

import {
  fetchCenterAuthorizedPrograms,
  syncCenterProgramEnablement as syncPrograms,
} from "@/lib/centerProgramApi";

describe("centerCurriculumApi", () => {
  beforeEach(() => {
    vi.mocked(fetchCenterAuthorizedPrograms).mockReset();
    vi.mocked(syncPrograms).mockReset();
  });

  it("fetchCenterAuthorizedProgramIds maps program ids", async () => {
    vi.mocked(fetchCenterAuthorizedPrograms).mockResolvedValue([
      { centerId: "c1", programId: "p1", programName: "Abacus", authorizedAt: "" },
    ]);
    const ids = await fetchCenterAuthorizedProgramIds("c1");
    expect(ids).toEqual(["p1"]);
  });

  it("setCenterCourseAuthorized enables program via sync", async () => {
    vi.mocked(fetchCenterAuthorizedPrograms).mockResolvedValue([]);
    vi.mocked(syncPrograms).mockResolvedValue(undefined);
    await setCenterCourseAuthorized("c1", "b1", "p1", true);
    expect(syncPrograms).toHaveBeenCalledWith("c1", ["p1"]);
  });

  it("setCenterCourseAuthorized disables program via sync", async () => {
    vi.mocked(fetchCenterAuthorizedPrograms).mockResolvedValue([
      { centerId: "c1", programId: "p1", programName: "Abacus", authorizedAt: "" },
      { centerId: "c1", programId: "p2", programName: "Vedic", authorizedAt: "" },
    ]);
    vi.mocked(syncPrograms).mockResolvedValue(undefined);
    await setCenterCourseAuthorized("c1", "b1", "p1", false);
    expect(syncPrograms).toHaveBeenCalledWith("c1", ["p2"]);
  });
});
