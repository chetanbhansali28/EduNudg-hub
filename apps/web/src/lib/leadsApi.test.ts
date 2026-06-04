import { describe, expect, it, vi, beforeEach } from "vitest";
import { reassignLead, convertLeadToStudent, countStaleBrandLeads, submitBrandStudentApplication } from "./leadsApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("leadsApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("submitBrandStudentApplication calls RPC with required fields", async () => {
    rpc.mockResolvedValue({ data: "lead-1", error: null });

    const result = await submitBrandStudentApplication("abacusworld", {
      parentName: "Priya",
      whatsappE164: "+919876543210",
      email: "priya@example.com",
      city: "Bengaluru",
      pincode: "560001",
    });

    expect(result).toEqual({ id: "lead-1", error: null });
    expect(rpc).toHaveBeenCalledWith("submit_brand_student_application", {
      p_brand_slug: "abacusworld",
      p_parent_name: "Priya",
      p_whatsapp_e164: "+919876543210",
      p_email: "priya@example.com",
      p_city: "Bengaluru",
      p_pincode: "560001",
      p_child_name: null,
      p_child_dob: null,
      p_school_name: null,
      p_notes: null,
    });
  });

  it("regression_submitBrandStudentApplication_surfaces_rpc_error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Brand not found" } });

    const result = await submitBrandStudentApplication("missing", {
      parentName: "A",
      whatsappE164: "+911",
      email: "a@b.com",
      city: "X",
      pincode: "1",
    });

    expect(result.id).toBeNull();
    expect(result.error).toBe("Brand not found");
  });

  it("countStaleBrandLeads calls count_stale_brand_leads RPC", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });
    const count = await countStaleBrandLeads("brand-1");
    expect(count).toBe(3);
    expect(rpc).toHaveBeenCalledWith("count_stale_brand_leads", { p_brand_id: "brand-1" });
  });

  it("reassignLead calls reassign_lead RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await reassignLead("lead-1", "center-1");
    expect(rpc).toHaveBeenCalledWith("reassign_lead", {
      p_lead_id: "lead-1",
      p_center_id: "center-1",
    });
  });

  it("convertLeadToStudent passes overrides jsonb", async () => {
    rpc.mockResolvedValue({ data: "student-1", error: null });
    await convertLeadToStudent("lead-1", {
      parentName: "Parent",
      childName: "Child",
      city: "Mumbai",
    });
    expect(rpc).toHaveBeenCalledWith("convert_lead_to_student", {
      p_lead_id: "lead-1",
      p_overrides: expect.objectContaining({
        parent_name: "Parent",
        child_name: "Child",
        city: "Mumbai",
      }),
    });
  });
});
