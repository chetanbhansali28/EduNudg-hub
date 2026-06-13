import { describe, expect, it, vi, beforeEach } from "vitest";
import { setFranchiseCenterStatus } from "./centerCentersApi";

const rpc = vi.fn();
const fromUpdate = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc,
    from: () => ({
      update: () => ({
        eq: fromUpdate,
      }),
    }),
  }),
}));

describe("centerCentersApi RPC", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromUpdate.mockReset();
  });

  it("setFranchiseCenterStatus calls lifecycle RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await setFranchiseCenterStatus("center-1", "suspended", "Policy violation");
    expect(rpc).toHaveBeenCalledWith("set_franchise_center_status", {
      p_center_id: "center-1",
      p_status: "suspended",
      p_reason: "Policy violation",
    });
  });
});
