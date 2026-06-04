import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type PlatformInvoiceRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type BrandSubscriptionRow = {
  id: string;
  status: string;
  plan_id: string;
  subscription_plans: { name: string; price_cents: number; currency: string } | null;
};

export async function fetchBrandBillingSummary(brandId: string): Promise<{
  subscription: BrandSubscriptionRow | null;
  invoices: PlatformInvoiceRow[];
}> {
  const [subRes, invRes] = await Promise.all([
    getSupabase()
      .from("brand_subscriptions")
      .select("id, status, plan_id, subscription_plans(name, price_cents, currency)")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getSupabase()
      .from("platform_invoices")
      .select("id, amount_cents, currency, status, due_at, paid_at, created_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (subRes.error) throw subRes.error;
  if (invRes.error) throw invRes.error;

  return {
    subscription: subRes.data as BrandSubscriptionRow | null,
    invoices: supabaseList(invRes.data, null) as PlatformInvoiceRow[],
  };
}
