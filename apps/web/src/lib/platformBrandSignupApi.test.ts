import { describe, expect, it, vi, beforeEach } from "vitest";
import { rejectPlatformBrandSignup, submitPlatformBrandSignup } from "./platformBrandSignupApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("platformBrandSignupApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("submitPlatformBrandSignup calls RPC", async () => {
    rpc.mockResolvedValue({ data: "signup-1", error: null });
    const result = await submitPlatformBrandSignup({
      requestedName: "Abacus World",
      adminFullName: "Owner",
      email: "owner@example.com",
      city: "Mumbai",
    });
    expect(result).toEqual({ id: "signup-1", error: null });
    expect(rpc).toHaveBeenCalledWith(
      "submit_platform_brand_signup",
      expect.objectContaining({
        p_requested_name: "Abacus World",
        p_email: "owner@example.com",
      })
    );
  });

  it("rejectPlatformBrandSignup calls RPC with reason", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const result = await rejectPlatformBrandSignup("signup-1", "Duplicate request");
    expect(result.error).toBeNull();
    expect(rpc).toHaveBeenCalledWith("reject_platform_brand_signup", {
      p_signup_id: "signup-1",
      p_reason: "Duplicate request",
    });
  });
});
