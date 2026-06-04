import { getSupabase } from "@/lib/supabase";

export async function approveFranchiseInquiry(
  inquiryId: string,
  options?: { centerSlug?: string; centerName?: string }
): Promise<{ centerId: string | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("approve_franchise_inquiry", {
    p_inquiry_id: inquiryId,
    p_center_slug: options?.centerSlug?.trim() || null,
    p_center_name: options?.centerName?.trim() || null,
  });
  if (error) return { centerId: null, error: error.message };
  return { centerId: data as string, error: null };
}

export async function rejectFranchiseInquiry(
  inquiryId: string,
  reason: string
): Promise<{ error: string | null }> {
  const { error } = await getSupabase().rpc("reject_franchise_inquiry", {
    p_inquiry_id: inquiryId,
    p_reason: reason.trim(),
  });
  if (error) return { error: error.message };
  return { error: null };
}
