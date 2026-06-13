import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cloneCurriculumVersionToDraft,
  deleteLevelSafe,
  fetchCourseImpactStats,
  publishVersion,
  reorderLevels,
  reorderUnits,
  unpublishVersion,
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

  it("publishVersion sets status published", async () => {
    const update = vi.fn(() => chain(null));
    fromMock.mockReturnValue({ update, eq: vi.fn(() => chain(null)) });
    await publishVersion("v1");
    expect(fromMock).toHaveBeenCalledWith("curriculum_versions");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published" }),
    );
  });

  it("unpublishVersion sets status draft", async () => {
    const update = vi.fn(() => chain(null));
    fromMock.mockReturnValue({ update, eq: vi.fn(() => chain(null)) });
    await unpublishVersion("v1");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft", published_at: null }),
    );
  });

  it("cloneCurriculumVersionToDraft calls RPC", async () => {
    rpc.mockResolvedValue({ data: "v2", error: null });
    const id = await cloneCurriculumVersionToDraft("v1");
    expect(id).toBe("v2");
    expect(rpc).toHaveBeenCalledWith("clone_curriculum_version_to_draft", {
      p_version_id: "v1",
    });
  });

  it("deleteLevelSafe calls RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteLevelSafe("l1");
    expect(rpc).toHaveBeenCalledWith("delete_curriculum_level", { p_level_id: "l1" });
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
      if (table === "curriculum_versions") {
        return chain([{ id: "v1", program_id: "p1", version_number: 1, status: "draft" }]);
      }
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
