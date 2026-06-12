import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchStudentLearnHome, StudentLearnRpcError } from "./studentLearnApi";
import { parseStudentLearnError } from "./studentLearnErrors";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("studentLearnApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("fetchStudentLearnHome calls get_student_learn_home RPC", async () => {
    rpc.mockResolvedValue({
      data: {
        student: { id: "s1", full_name: "Test", student_code: null, date_of_birth: null, profile: {} },
        brand: { id: "b1", name: "Brand", logo_url: null },
        enrollment: { enrollment_id: "e1", status: "active", enrolled_at: "", center_id: "c1" },
        center: { id: "c1", display_name: "Center", public_url: "" },
        curriculum_ladder: { levels: [], completion_pct: 0, current_level_id: null },
        stats: {
          levels_completed: 0,
          levels_total: 0,
          assessments_count: 0,
          avg_score_pct: null,
          competitions_registered: 0,
          competitions_completed: 0,
        },
        upcoming_competitions: [],
        my_registrations: [],
        recent_results: [],
        recent_assessments: [],
        recent_activity: [],
        quick_actions: [],
      },
      error: null,
    });
    const result = await fetchStudentLearnHome("brand-1");
    expect(result.student.full_name).toBe("Test");
    expect(rpc).toHaveBeenCalledWith("get_student_learn_home", { p_brand_id: "brand-1" });
  });

  it("throws StudentLearnRpcError on NO_ACTIVE_ENROLLMENT", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "NO_ACTIVE_ENROLLMENT" } });
    await expect(fetchStudentLearnHome("brand-1")).rejects.toBeInstanceOf(StudentLearnRpcError);
  });
});

describe("parseStudentLearnError", () => {
  it("parses known codes", () => {
    expect(parseStudentLearnError({ message: "NO_ACTIVE_ENROLLMENT" })).toBe("NO_ACTIVE_ENROLLMENT");
    expect(parseStudentLearnError({ message: "PAID_ENROLLMENT_NOT_AVAILABLE" })).toBe(
      "PAID_ENROLLMENT_NOT_AVAILABLE"
    );
  });
});
