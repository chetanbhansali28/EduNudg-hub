import { getSupabase } from "@/lib/supabase";
import type { MerchandiseShippingMode } from "@/lib/merchandiseOrdersApi";

export type ShippingAddressSnapshot = {
  name: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export async function resolveFranchiseAddress(centerId: string): Promise<ShippingAddressSnapshot | null> {
  const { data, error } = await getSupabase()
    .from("franchise_centers")
    .select("name, display_name, address_line1, city, region, country")
    .eq("id", centerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    name: data.display_name ?? data.name,
    address_line1: data.address_line1 ?? undefined,
    city: data.city ?? undefined,
    state: data.region ?? undefined,
    country: data.country ?? "IN",
  };
}

export async function resolveStudentAddress(
  brandId: string,
  studentId: string
): Promise<ShippingAddressSnapshot | null> {
  const { data: student, error: sErr } = await getSupabase()
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .eq("brand_id", brandId)
    .maybeSingle();
  if (sErr) throw sErr;

  const { data: profile, error: pErr } = await getSupabase()
    .from("student_profiles")
    .select("address_line1, city, state, pincode, phone")
    .eq("student_id", studentId)
    .maybeSingle();
  if (pErr) throw pErr;

  if (!student) return null;
  return {
    name: student.full_name,
    phone: profile?.phone ?? undefined,
    address_line1: profile?.address_line1 ?? undefined,
    city: profile?.city ?? undefined,
    state: profile?.state ?? undefined,
    pincode: profile?.pincode ?? undefined,
    country: "IN",
  };
}

export function isShippingAddressComplete(
  mode: MerchandiseShippingMode,
  address: ShippingAddressSnapshot | null
): boolean {
  if (!address) return false;
  if (mode === "franchise") return Boolean(address.address_line1 && address.city);
  if (mode === "student") {
    return Boolean(address.address_line1 && address.city && address.pincode && address.phone);
  }
  return Boolean(address.address_line1 && address.city && address.pincode);
}

export function snapshotCustomAddress(input: {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}): ShippingAddressSnapshot {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    address_line1: input.addressLine1.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
    country: "IN",
  };
}
