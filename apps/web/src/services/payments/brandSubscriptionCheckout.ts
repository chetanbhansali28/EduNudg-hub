import { getSupabase } from "@/lib/supabase";

export async function createBrandSubscriptionCheckout(
  brandId: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await getSupabase().rpc("create_brand_subscription_checkout", {
    p_brand_id: brandId,
  });
  if (error) return { data: null, error: error.message };
  return { data: data as Record<string, unknown>, error: null };
}
