import { getSupabase } from "@/lib/supabase";

export type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "converted";

export interface LeadRow {
  id: string;
  brand_id: string;
  center_id: string | null;
  full_name: string;
  parent_name: string | null;
  email: string | null;
  whatsapp_e164: string | null;
  child_name: string | null;
  child_dob: string | null;
  pincode: string | null;
  city: string | null;
  school_name: string | null;
  status: LeadStatus;
  lead_source: string | null;
  lost_reason: string | null;
  assigned_at: string | null;
  stale_at: string | null;
  last_center_action_at: string | null;
  created_at: string;
}

export async function submitBrandStudentApplication(
  brandSlug: string,
  payload: {
    parentName: string;
    whatsappE164: string;
    email: string;
    city: string;
    pincode: string;
    childName?: string;
    childDob?: string;
    schoolName?: string;
    notes?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("submit_brand_student_application", {
    p_brand_slug: brandSlug,
    p_parent_name: payload.parentName,
    p_whatsapp_e164: payload.whatsappE164,
    p_email: payload.email,
    p_city: payload.city,
    p_pincode: payload.pincode,
    p_child_name: payload.childName || null,
    p_child_dob: payload.childDob || null,
    p_school_name: payload.schoolName || null,
    p_notes: payload.notes || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function submitCenterStudentRegistration(
  brandSlug: string,
  centerSlug: string,
  payload: {
    parentName: string;
    whatsappE164: string;
    email: string;
    city?: string;
    pincode?: string;
    childName?: string;
    childDob?: string;
    schoolName?: string;
    notes?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("submit_center_student_registration", {
    p_brand_slug: brandSlug,
    p_center_slug: centerSlug,
    p_parent_name: payload.parentName,
    p_whatsapp_e164: payload.whatsappE164,
    p_email: payload.email,
    p_city: payload.city || null,
    p_pincode: payload.pincode || null,
    p_child_name: payload.childName || null,
    p_child_dob: payload.childDob || null,
    p_school_name: payload.schoolName || null,
    p_notes: payload.notes || null,
  });
  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}

export async function suggestCentersForLead(leadId: string) {
  const { data, error } = await getSupabase().rpc("suggest_centers_for_lead", { p_lead_id: leadId });
  if (error) throw error;
  return data as { exact: unknown[]; near: unknown[] };
}

export async function assignLeadToCenter(leadId: string, centerId: string) {
  const { error } = await getSupabase().rpc("assign_lead_to_center", {
    p_lead_id: leadId,
    p_center_id: centerId,
  });
  if (error) throw error;
}

export async function reassignLead(leadId: string, centerId: string) {
  const { error } = await getSupabase().rpc("reassign_lead", {
    p_lead_id: leadId,
    p_center_id: centerId,
  });
  if (error) throw error;
}

export async function reopenLead(leadId: string) {
  const { error } = await getSupabase().rpc("reopen_lead", { p_lead_id: leadId });
  if (error) throw error;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await getSupabase().rpc("update_lead_status", {
    p_lead_id: leadId,
    p_status: status,
  });
  if (error) throw error;
}

export async function markLeadLost(leadId: string, reason: string) {
  const { error } = await getSupabase().rpc("mark_lead_lost", {
    p_lead_id: leadId,
    p_reason: reason,
  });
  if (error) throw error;
}

export type ConvertLeadOverrides = {
  parentName?: string;
  childName?: string;
  childDob?: string;
  schoolName?: string;
  city?: string;
  pincode?: string;
};

export async function convertLeadToStudent(leadId: string, overrides?: ConvertLeadOverrides) {
  const { data, error } = await getSupabase().rpc("convert_lead_to_student", {
    p_lead_id: leadId,
    p_overrides: overrides
      ? {
          parent_name: overrides.parentName ?? null,
          child_name: overrides.childName ?? null,
          child_dob: overrides.childDob ?? null,
          school_name: overrides.schoolName ?? null,
          city: overrides.city ?? null,
          pincode: overrides.pincode ?? null,
        }
      : {},
  });
  if (error) throw error;
  return data as string;
}
