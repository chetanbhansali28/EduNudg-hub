import { describe, expect, it, vi, beforeEach } from "vitest";
import { approveFranchiseInquiry, rejectFranchiseInquiry } from "./franchiseInquiriesApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("franchiseInquiriesApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("approveFranchiseInquiry calls RPC", async () => {
    rpc.mockResolvedValue({ data: "center-1", error: null });
    const result = await approveFranchiseInquiry("inq-1", { centerSlug: "koramangala" });
    expect(result).toEqual({ centerId: "center-1", error: null });
    expect(rpc).toHaveBeenCalledWith("approve_franchise_inquiry", {
      p_inquiry_id: "inq-1",
      p_center_slug: "koramangala",
      p_center_name: null,
    });
  });

  it("rejectFranchiseInquiry calls RPC with reason", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const result = await rejectFranchiseInquiry("inq-2", "Out of territory");
    expect(result).toEqual({ error: null });
    expect(rpc).toHaveBeenCalledWith("reject_franchise_inquiry", {
      p_inquiry_id: "inq-2",
      p_reason: "Out of territory",
    });
  });
});
