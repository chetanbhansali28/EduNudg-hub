import { describe, expect, it, vi } from "vitest";
import { pinEnrollmentProgram } from "./studentPortalAdminApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("studentPortalAdminApi", () => {
  it("regression_pinEnrollmentProgram_sends_start_level", async () => {
    rpc.mockResolvedValue({ error: null });
    await pinEnrollmentProgram("e1", "p1", "l2");
    expect(rpc).toHaveBeenCalledWith("pin_enrollment_program", {
      p_enrollment_id: "e1",
      p_program_id: "p1",
      p_start_level_id: "l2",
    });
  });
});
