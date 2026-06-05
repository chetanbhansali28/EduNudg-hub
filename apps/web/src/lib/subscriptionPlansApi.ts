import { getSupabase } from "@/lib/supabase";
import { parsePlanFeatures, type PublicSubscriptionPlan } from "./subscriptionPlanFeatures";

export async function fetchPublicSubscriptionPlans(): Promise<PublicSubscriptionPlan[]> {
  const { data, error } = await getSupabase().rpc("list_public_subscription_plans");
  if (error) throw error;
  const rows = (data ?? []) as (Omit<PublicSubscriptionPlan, "features"> & { features?: unknown })[];
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    ...row,
    features: parsePlanFeatures(row.features),
  }));
}
