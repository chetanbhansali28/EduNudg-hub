import { describe, expect, it, vi, beforeEach } from "vitest";
import { syncCenterProgramEnablement } from "./centerProgramApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("centerProgramApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("syncCenterProgramEnablement calls RPC with program ids", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await syncCenterProgramEnablement("center-1", ["prog-a", "prog-b"]);
    expect(rpc).toHaveBeenCalledWith("sync_center_program_enablement", {
      p_center_id: "center-1",
      p_program_ids: ["prog-a", "prog-b"],
    });
  });
});
