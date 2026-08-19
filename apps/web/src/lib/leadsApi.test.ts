import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  LEAD_LIST_SELECT,
  assignLeadToCenter,
  convertLeadToStudent,
  countStaleBrandLeads,
  listBrandLeads,
  listCenterLeads,
  markLeadLost,
  reassignLead,
  reopenLead,
  submitBrandStudentApplication,
  updateLeadStatus,
} from "./leadsApi";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from }),
}));

describe("leadsApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it("regression_lead_list_select_includes_csv_aligned_columns", () => {
    for (const column of ["login_email", "address_line1", "state", "program_name", "starting_level", "notes"]) {
      expect(LEAD_LIST_SELECT).toContain(column);
    }
  });

  it("regression_listBrandLeads_selects_csv_aligned_columns", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValue({ select });

    await listBrandLeads("brand-1");

    expect(from).toHaveBeenCalledWith("leads");
    expect(select).toHaveBeenCalledWith(LEAD_LIST_SELECT);
    expect(eq).toHaveBeenCalledWith("brand_id", "brand-1");
  });

  it("regression_listCenterLeads_selects_csv_aligned_columns", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValue({ select });

    await listCenterLeads("center-1");

    expect(from).toHaveBeenCalledWith("leads");
    expect(select).toHaveBeenCalledWith(LEAD_LIST_SELECT);
    expect(eq).toHaveBeenCalledWith("center_id", "center-1");
  });

  it("B-PUB / submitBrandStudentApplication calls RPC with required fields", async () => {
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

  it("E2E-06 / B-01 countStaleBrandLeads calls count_stale_brand_leads RPC", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });
    const count = await countStaleBrandLeads("brand-1");
    expect(count).toBe(3);
    expect(rpc).toHaveBeenCalledWith("count_stale_brand_leads", { p_brand_id: "brand-1" });
  });

  it("B-06 assignLeadToCenter calls assign_lead_to_center RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await assignLeadToCenter("lead-1", "center-1");
    expect(rpc).toHaveBeenCalledWith("assign_lead_to_center", {
      p_lead_id: "lead-1",
      p_center_id: "center-1",
    });
  });

  it("B-08 reassignLead calls reassign_lead RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await reassignLead("lead-1", "center-1");
    expect(rpc).toHaveBeenCalledWith("reassign_lead", {
      p_lead_id: "lead-1",
      p_center_id: "center-1",
    });
  });

  it("C-08 markLeadLost calls mark_lead_lost with reason", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await markLeadLost("lead-1", "Not interested");
    expect(rpc).toHaveBeenCalledWith("mark_lead_lost", {
      p_lead_id: "lead-1",
      p_reason: "Not interested",
    });
  });

  it("B-09 / E2E-05 reopenLead calls reopen_lead RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await reopenLead("lead-1");
    expect(rpc).toHaveBeenCalledWith("reopen_lead", { p_lead_id: "lead-1" });
  });

  it("C-04 updateLeadStatus calls update_lead_status RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await updateLeadStatus("lead-1", "contacted");
    expect(rpc).toHaveBeenCalledWith("update_lead_status", {
      p_lead_id: "lead-1",
      p_status: "contacted",
    });
  });

  it("C-07 convertLeadToStudent passes overrides jsonb", async () => {
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
