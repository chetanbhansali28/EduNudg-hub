import { describe, expect, it, vi, beforeEach } from "vitest";
import { createBrandStudentLeadStaff, createPlatformBrandSignupStaff } from "./manualLeadsApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("manualLeadsApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("createPlatformBrandSignupStaff calls RPC", async () => {
    rpc.mockResolvedValue({ data: "s1", error: null });
    const result = await createPlatformBrandSignupStaff({
      requestedName: "Abacus",
      adminFullName: "Owner",
      email: "o@example.com",
      city: "Mumbai",
    });
    expect(result.id).toBe("s1");
    expect(rpc).toHaveBeenCalledWith("create_platform_brand_signup_staff", expect.any(Object));
  });

  it("createBrandStudentLeadStaff calls RPC", async () => {
    rpc.mockResolvedValue({ data: "l1", error: null });
    const result = await createBrandStudentLeadStaff("brand-id", {
      parentName: "Priya",
      whatsappE164: "+919876543210",
    });
    expect(result.id).toBe("l1");
    expect(rpc).toHaveBeenCalledWith("create_brand_student_lead_staff", expect.objectContaining({ p_brand_id: "brand-id" }));
  });
});
