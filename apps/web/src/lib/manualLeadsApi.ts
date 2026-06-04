import { getSupabase } from "@/lib/supabase";

export async function createPlatformBrandSignupStaff(input: {
  requestedName: string;
  adminFullName: string;
  email: string;
  city: string;
  phoneE164?: string;
  message?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_platform_brand_signup_staff", {
    p_requested_name: input.requestedName.trim(),
    p_admin_full_name: input.adminFullName.trim(),
    p_email: input.email.trim(),
    p_city: input.city.trim(),
    p_phone_e164: input.phoneE164?.trim() || null,
    p_message: input.message?.trim() || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function createFranchiseInquiryStaff(
  brandId: string,
  input: {
    fullName: string;
    email: string;
    phoneE164?: string;
    city?: string;
    message?: string;
    proposedFranchiseName?: string;
    addressLine?: string;
    state?: string;
    pincode?: string;
    priorExperience?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_franchise_inquiry_staff", {
    p_brand_id: brandId,
    p_full_name: input.fullName.trim(),
    p_email: input.email.trim(),
    p_phone_e164: input.phoneE164?.trim() || null,
    p_city: input.city?.trim() || null,
    p_message: input.message?.trim() || null,
    p_proposed_franchise_name: input.proposedFranchiseName?.trim() || null,
    p_address_line: input.addressLine?.trim() || null,
    p_state: input.state?.trim() || null,
    p_pincode: input.pincode?.trim() || null,
    p_prior_experience: input.priorExperience?.trim() || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function createBrandStudentLeadStaff(
  brandId: string,
  input: {
    parentName: string;
    whatsappE164: string;
    email?: string;
    city?: string;
    pincode?: string;
    childName?: string;
    childDob?: string;
    schoolName?: string;
    notes?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_brand_student_lead_staff", {
    p_brand_id: brandId,
    p_parent_name: input.parentName.trim(),
    p_whatsapp_e164: input.whatsappE164.trim(),
    p_email: input.email?.trim() || null,
    p_city: input.city?.trim() || null,
    p_pincode: input.pincode?.trim() || null,
    p_child_name: input.childName?.trim() || null,
    p_child_dob: input.childDob || null,
    p_school_name: input.schoolName?.trim() || null,
    p_notes: input.notes?.trim() || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function createCenterStudentLeadStaff(
  centerId: string,
  input: {
    parentName: string;
    whatsappE164: string;
    email?: string;
    city?: string;
    pincode?: string;
    childName?: string;
    childDob?: string;
    schoolName?: string;
    notes?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_center_student_lead_staff", {
    p_center_id: centerId,
    p_parent_name: input.parentName.trim(),
    p_whatsapp_e164: input.whatsappE164.trim(),
    p_email: input.email?.trim() || null,
    p_city: input.city?.trim() || null,
    p_pincode: input.pincode?.trim() || null,
    p_child_name: input.childName?.trim() || null,
    p_child_dob: input.childDob || null,
    p_school_name: input.schoolName?.trim() || null,
    p_notes: input.notes?.trim() || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}
