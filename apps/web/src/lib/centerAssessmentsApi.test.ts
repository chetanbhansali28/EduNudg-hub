import { describe, expect, it, vi } from "vitest";
import { recordStudentAssessment } from "./centerAssessmentsApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from: vi.fn() }),
}));

describe("centerAssessmentsApi", () => {
  it("regression_recordStudentAssessment_sends_level_and_passed", async () => {
    rpc.mockResolvedValue({ data: "assessment-id", error: null });

    await recordStudentAssessment("center-1", {
      studentId: "s1",
      assessmentType: "level_check",
      score: 85,
      maxScore: 100,
      levelId: "l2",
      passed: true,
    });

    expect(rpc).toHaveBeenCalledWith("record_student_assessment", {
      p_center_id: "center-1",
      p_student_id: "s1",
      p_assessment_type: "level_check",
      p_score: 85,
      p_max_score: 100,
      p_assessed_at: null,
      p_notes: null,
      p_visible_to_student: true,
      p_level_id: "l2",
      p_passed: true,
    });
  });
});
