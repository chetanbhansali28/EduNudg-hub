import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deleteLevelSafe,
  fetchCourseImpactStats,
  purgeProgram,
  reorderLevels,
  reorderUnits,
} from "./curriculumApi";

const rpc = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc }),
}));

function chain(data: unknown, opts?: { count?: number }) {
  const result = { data, error: null, count: opts?.count ?? null };
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    is: vi.fn(() => api),
    in: vi.fn(() => api),
    order: vi.fn(() => api),
    insert: vi.fn(() => api),
    update: vi.fn(() => api),
    delete: vi.fn(() => api),
    single: vi.fn(async () => result),
    then: (resolve: (v: typeof result) => void) => resolve(result),
  };
  return api;
}

describe("curriculumApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromMock.mockReset();
  });

  it("deleteLevelSafe calls RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteLevelSafe("l1");
    expect(rpc).toHaveBeenCalledWith("delete_curriculum_level", { p_level_id: "l1" });
  });

  it("purgeProgram calls purge_curriculum_program RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await purgeProgram("p-legacy");
    expect(rpc).toHaveBeenCalledWith("purge_curriculum_program", { p_program_id: "p-legacy" });
  });

  it("reorderLevels updates sort_order for each level", async () => {
    const update = vi.fn(() => ({ eq: vi.fn(() => chain(null)) }));
    fromMock.mockReturnValue({ update });
    await reorderLevels(["l2", "l1", "l3"]);
    expect(update).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(update).toHaveBeenNthCalledWith(2, { sort_order: 2 });
    expect(update).toHaveBeenNthCalledWith(3, { sort_order: 3 });
  });

  it("reorderUnits updates sort_order for each lesson", async () => {
    const update = vi.fn(() => ({ eq: vi.fn(() => chain(null)) }));
    fromMock.mockReturnValue({ update });
    await reorderUnits(["u1", "u2"]);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(update).toHaveBeenNthCalledWith(2, { sort_order: 2 });
  });

  it("fetchCourseImpactStats returns center and batch counts", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "center_program_enablement") {
        return chain(null, { count: 2 });
      }
      if (table === "batches") {
        return chain(null, { count: 5 });
      }
      return chain([]);
    });

    const stats = await fetchCourseImpactStats("brand-1", "p1");
    expect(stats).toEqual({ authorizedCenters: 2, activeBatches: 5 });
  });
});
