import { getSupabase } from "@/lib/supabase";

export type StudentDeliveryAddress = {
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type StudentProfileAddress = StudentDeliveryAddress & {
  school_name: string | null;
};

export async function fetchStudentProfileAddress(
  studentId: string
): Promise<StudentProfileAddress | null> {
  const { data, error } = await getSupabase()
    .from("student_profiles")
    .select("address_line1, city, state, pincode, phone, school_name")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Upsert delivery address on the one-row-per-student profile (conflict on student_id). */
export async function upsertStudentDeliveryAddress(
  brandId: string,
  studentId: string,
  address: StudentDeliveryAddress
): Promise<void> {
  const { error } = await getSupabase()
    .from("student_profiles")
    .upsert(
      {
        brand_id: brandId,
        student_id: studentId,
        address_line1: address.address_line1.trim() || null,
        city: address.city.trim() || null,
        state: address.state.trim() || null,
        pincode: address.pincode.trim() || null,
        phone: address.phone.trim() || null,
      },
      { onConflict: "student_id" }
    );
  if (error) throw error;
}
