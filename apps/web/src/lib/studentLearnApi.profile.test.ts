import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateStudentSelfProfile } from "./studentLearnApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("studentLearnApi updateStudentSelfProfile", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockReturnValue({ data: { id: "s1" }, error: null });
  });

  it("calls update_student_self_profile RPC with required fields", async () => {
    await updateStudentSelfProfile("brand-1", {
      fullName: "  Asha Kumar  ",
      dateOfBirth: "2015-06-01",
      phone: "9876543210",
      pincode: "560001",
      photoUrl: "https://cdn/student-1/photo.jpg",
      schoolName: " Demo School ",
      city: " Bengaluru ",
      addressLine1: " 12 Main St ",
      state: " KA ",
    });

    expect(rpc).toHaveBeenCalledWith("update_student_self_profile", {
      p_brand_id: "brand-1",
      p_full_name: "Asha Kumar",
      p_date_of_birth: "2015-06-01",
      p_phone: "9876543210",
      p_pincode: "560001",
      p_photo_url: "https://cdn/student-1/photo.jpg",
      p_school_name: "Demo School",
      p_city: "Bengaluru",
      p_address_line1: "12 Main St",
      p_state: "KA",
    });
  });
});
