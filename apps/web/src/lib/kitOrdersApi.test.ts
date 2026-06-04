import { describe, expect, it, vi, beforeEach } from "vitest";
import { allocateStudentKit, updateKitOrderStatus } from "./kitOrdersApi";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from }),
}));

describe("kitOrdersApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it("updateKitOrderStatus updates kit_orders row", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await updateKitOrderStatus("order-1", "approved");

    expect(rpc).toHaveBeenCalledWith("update_kit_order_status_rpc", {
      p_order_id: "order-1",
      p_status: "approved",
    });
  });

  it("allocateStudentKit calls RPC", async () => {
    rpc.mockResolvedValue({ data: "alloc-1", error: null });
    const id = await allocateStudentKit("center-1", "student-1", "line-1");
    expect(id).toBe("alloc-1");
    expect(rpc).toHaveBeenCalledWith("allocate_student_kit", {
      p_center_id: "center-1",
      p_student_id: "student-1",
      p_order_line_id: "line-1",
    });
  });
});
