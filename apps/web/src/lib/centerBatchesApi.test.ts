import { describe, expect, it, vi, beforeEach } from "vitest";
import { upsertCenterBatch, getCenterUnseenBatchJoins } from "./centerBatchesApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("centerBatchesApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("upsertCenterBatch calls RPC with trimmed name", async () => {
    rpc.mockResolvedValue({ data: "batch-1", error: null });
    const id = await upsertCenterBatch({
      centerId: "c1",
      name: "  Morning L1-3  ",
      curriculumVersionId: "cv1",
      levelStartId: "l1",
      levelEndId: "l3",
      isOpenForEnrollment: true,
    });
    expect(id).toBe("batch-1");
    expect(rpc).toHaveBeenCalledWith("upsert_center_batch", expect.objectContaining({
      p_name: "Morning L1-3",
      p_is_open_for_enrollment: true,
    }));
  });

  it("getCenterUnseenBatchJoins returns count", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });
    await expect(getCenterUnseenBatchJoins("c1")).resolves.toBe(3);
  });
});
