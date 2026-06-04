import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchStudentLearnDashboard } from "./studentLearnApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("studentLearnApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("fetchStudentLearnDashboard calls RPC", async () => {
    rpc.mockResolvedValue({
      data: { students: [], upcoming_competitions: [] },
      error: null,
    });
    const result = await fetchStudentLearnDashboard("brand-1");
    expect(result.students).toEqual([]);
    expect(rpc).toHaveBeenCalledWith("get_student_learn_dashboard", { p_brand_id: "brand-1" });
  });
});
