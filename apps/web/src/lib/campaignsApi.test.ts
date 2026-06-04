import { describe, expect, it, vi, beforeEach } from "vitest";
import { deleteBrandCampaign, upsertBrandCampaign } from "./campaignsApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from: vi.fn() }),
}));

describe("campaignsApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("upsertBrandCampaign calls RPC", async () => {
    rpc.mockResolvedValue({ data: "c1", error: null });
    const id = await upsertBrandCampaign("brand-1", { name: "Summer enroll" });
    expect(id).toBe("c1");
    expect(rpc).toHaveBeenCalledWith(
      "upsert_brand_campaign",
      expect.objectContaining({ p_brand_id: "brand-1", p_name: "Summer enroll" })
    );
  });

  it("deleteBrandCampaign calls RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteBrandCampaign("brand-1", "c1");
    expect(rpc).toHaveBeenCalledWith("delete_brand_campaign", { p_brand_id: "brand-1", p_id: "c1" });
  });
});
