import { describe, expect, it, vi, beforeEach } from "vitest";
import { upsertStudentDeliveryAddress } from "./studentProfileApi";

const upsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({ upsert }),
  }),
}));

describe("studentProfileApi", () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockReturnValue({ error: null });
  });

  it("regression_upsertStudentDeliveryAddress uses student_id onConflict", async () => {
    await upsertStudentDeliveryAddress("brand-1", "student-1", {
      address_line1: "12 Main St",
      city: "Bengaluru",
      state: "KA",
      pincode: "560034",
      phone: "+919876543210",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        brand_id: "brand-1",
        student_id: "student-1",
        address_line1: "12 Main St",
      }),
      { onConflict: "student_id" }
    );
  });
});
