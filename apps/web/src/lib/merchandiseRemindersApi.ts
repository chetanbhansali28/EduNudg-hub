import { getSupabase } from "@/lib/supabase";

export type MerchandisePaymentAlerts = {
  unpaid_count: number;
  unpaid_total_cents: number;
  overdue_count: number;
};

export async function listCenterMerchandisePaymentAlerts(
  centerId: string
): Promise<MerchandisePaymentAlerts> {
  const { data, error } = await getSupabase().rpc("list_center_merchandise_payment_alerts", {
    p_center_id: centerId,
  });
  if (error) throw error;
  const row = data as MerchandisePaymentAlerts;
  return {
    unpaid_count: Number(row.unpaid_count ?? 0),
    unpaid_total_cents: Number(row.unpaid_total_cents ?? 0),
    overdue_count: Number(row.overdue_count ?? 0),
  };
}
