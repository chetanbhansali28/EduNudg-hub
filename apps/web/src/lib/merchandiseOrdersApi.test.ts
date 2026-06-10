import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  allocateStudentMerchandise,
  createCenterMerchandiseOrder,
  recordMerchandisePayment,
  updateMerchandiseOrderStatus,
} from "./merchandiseOrdersApi";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from }),
}));

describe("merchandiseOrdersApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it("regression_update_merchandise_order_status", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await updateMerchandiseOrderStatus("order-1", "approved");
    expect(rpc).toHaveBeenCalledWith("update_merchandise_order_status_rpc", {
      p_order_id: "order-1",
      p_status: "approved",
      p_shipping_tracking: null,
    });
  });

  it("regression_allocate_student_merchandise", async () => {
    rpc.mockResolvedValue({ data: "alloc-1", error: null });
    const id = await allocateStudentMerchandise("center-1", "student-1", "line-1");
    expect(id).toBe("alloc-1");
    expect(rpc).toHaveBeenCalledWith("allocate_student_merchandise", {
      p_center_id: "center-1",
      p_student_id: "student-1",
      p_order_line_id: "line-1",
    });
  });

  it("regression_create_center_merchandise_order", async () => {
    rpc.mockResolvedValue({ data: "order-1", error: null });
    const id = await createCenterMerchandiseOrder("brand-1", "center-1", {
      lines: [{ catalogItemId: "cat-1", quantity: 2, unitPriceCents: 50000 }],
      shippingMode: "franchise",
      shippingAddress: { name: "Center" },
      paymentMethod: "invoice",
    });
    expect(id).toBe("order-1");
    expect(rpc).toHaveBeenCalledWith("create_center_merchandise_order_rpc", expect.objectContaining({
      p_brand_id: "brand-1",
      p_center_id: "center-1",
      p_payment_method: "invoice",
    }));
  });

  it("regression_brand_mark_invoice_paid_enables_approval", async () => {
    rpc.mockResolvedValue({ data: "pay-1", error: null });
    await recordMerchandisePayment("order-1", 100000, "manual", "Bank ref 123");
    expect(rpc).toHaveBeenCalledWith("record_merchandise_payment", {
      p_order_id: "order-1",
      p_amount_cents: 100000,
      p_method: "manual",
      p_reference_notes: "Bank ref 123",
    });
  });
});
