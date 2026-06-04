import { describe, expect, it, vi } from "vitest";
import { fetchCenterOpsReport } from "./centerReportsApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("centerReportsApi", () => {
  it("fetchCenterOpsReport calls RPC", async () => {
    rpc.mockResolvedValue({
      data: { active_enrollments: 5, open_leads: 2, converted_leads: 1, attendance_sessions_30d: 4, assessments_30d: 3, recent_assessments: [] },
      error: null,
    });
    const report = await fetchCenterOpsReport("center-1");
    expect(report.active_enrollments).toBe(5);
    expect(rpc).toHaveBeenCalledWith("get_center_ops_report", { p_center_id: "center-1" });
  });
});
