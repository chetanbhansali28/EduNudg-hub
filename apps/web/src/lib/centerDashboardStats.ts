import { getSupabase } from "@/lib/supabase";
import { listCenterMerchandisePaymentAlerts } from "@/lib/merchandiseRemindersApi";
import { countLowStockItems, fetchCenterInventorySummary } from "@/lib/centerInventoryApi";

export const LOW_STOCK_THRESHOLD = 5;

export interface CenterDashboardStats {
  batchCount: number;
  openLeads: number;
  pendingConversion: number;
  activeEnrollments: number;
  feeCollectionRate: number | null;
  overdueFeesCents: number;
  lowStockItems: number;
  unpaidMerchandiseCount: number;
  unpaidMerchandiseCents: number;
  overdueMerchandiseCount: number;
}

/** Fee collection rate: paid amount / billable amount (0–100). */
export function computeFeeCollectionRate(
  invoices: { amount_cents: number; status: string }[]
): { rate: number | null; overdueCents: number } {
  const billable = invoices.filter((i) => i.status !== "cancelled");
  if (billable.length === 0) return { rate: null, overdueCents: 0 };

  const paidCents = billable
    .filter((i) => i.status === "paid" || i.status === "partial")
    .reduce((s, i) => s + i.amount_cents, 0);
  const totalCents = billable.reduce((s, i) => s + i.amount_cents, 0);
  const overdueCents = billable
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount_cents, 0);

  return {
    rate: totalCents > 0 ? Math.round((paidCents / totalCents) * 100) : null,
    overdueCents,
  };
}

export async function fetchCenterDashboardStats(centerId: string): Promise<CenterDashboardStats> {
  const sb = getSupabase();

  const [batches, openLeads, pendingConversion, enrollments, invoices] = await Promise.all([
    sb.from("batches").select("id", { count: "exact", head: true }).eq("center_id", centerId),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .in("status", ["new", "contacted", "qualified"]),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("status", "qualified"),
    sb
      .from("student_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .eq("status", "active"),
    sb
      .from("invoices")
      .select("amount_cents, status")
      .eq("center_id", centerId),
  ]);

  const feeStats = computeFeeCollectionRate(invoices.data ?? []);

  let lowStockItems = 0;
  try {
    const { data: centerRow } = await sb
      .from("franchise_centers")
      .select("brand_id")
      .eq("id", centerId)
      .maybeSingle();
    if (centerRow?.brand_id) {
      const inventoryRows = await fetchCenterInventorySummary(centerRow.brand_id, centerId);
      lowStockItems = countLowStockItems(inventoryRows, LOW_STOCK_THRESHOLD);
    }
  } catch {
    const { data: stock } = await sb.from("inventory_stock").select("quantity").eq("center_id", centerId);
    lowStockItems = (stock ?? []).filter((row) => (row.quantity ?? 0) <= LOW_STOCK_THRESHOLD).length;
  }

  let merchandiseAlerts = { unpaid_count: 0, unpaid_total_cents: 0, overdue_count: 0 };
  try {
    merchandiseAlerts = await listCenterMerchandisePaymentAlerts(centerId);
  } catch {
    // merchandise feature may be off or RPC unavailable in tests
  }

  return {
    batchCount: batches.count ?? 0,
    openLeads: openLeads.count ?? 0,
    pendingConversion: pendingConversion.count ?? 0,
    activeEnrollments: enrollments.count ?? 0,
    feeCollectionRate: feeStats.rate,
    overdueFeesCents: feeStats.overdueCents,
    lowStockItems,
    unpaidMerchandiseCount: merchandiseAlerts.unpaid_count,
    unpaidMerchandiseCents: merchandiseAlerts.unpaid_total_cents,
    overdueMerchandiseCount: merchandiseAlerts.overdue_count,
  };
}
