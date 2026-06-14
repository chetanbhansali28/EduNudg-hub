import { describe, expect, it, vi } from "vitest";
import { fetchCenterStudentProgramContext } from "./centerStudentProgramApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("centerStudentProgramApi", () => {
  it("regression_fetchCenterStudentProgramContext_calls_rpc", async () => {
    rpc.mockResolvedValue({
      data: {
        enrollment_id: "e1",
        program_id: "p1",
        program_name: "Abacus Core",
        current_level_id: "l1",
        current_level_name: "Level 1",
        levels: [],
      },
      error: null,
    });

    const ctx = await fetchCenterStudentProgramContext("center-1", "student-1");
    expect(rpc).toHaveBeenCalledWith("get_center_student_program_context", {
      p_center_id: "center-1",
      p_student_id: "student-1",
    });
    expect(ctx.program_name).toBe("Abacus Core");
    expect(ctx.current_level_name).toBe("Level 1");
  });
});
