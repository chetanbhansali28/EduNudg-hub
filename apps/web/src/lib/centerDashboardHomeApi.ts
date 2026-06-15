import { fetchCenterBatches } from "@/lib/centerBatchesApi";
import { getCenterUnseenBatchJoins } from "@/lib/centerBatchesApi";
import {
  buildDashboardActionItems,
  buildDashboardBatchCard,
  countBatchesToday,
  findNextBatchTimeLabel,
  sortDashboardBatches,
  type DashboardActionItem,
  type DashboardBatchCard,
} from "@/lib/centerDashboardHelpers";
import { LOW_STOCK_THRESHOLD, computeFeeCollectionRate } from "@/lib/centerDashboardStats";
import { countLowStockItems, fetchCenterInventorySummary } from "@/lib/centerInventoryApi";
import { listCenterMerchandisePaymentAlerts } from "@/lib/merchandiseRemindersApi";
import { getSupabase } from "@/lib/supabase";

export type CenterDashboardHome = {
  openLeads: number;
  leadsToday: number;
  batchesToday: number;
  nextBatchTime: string | null;
  pendingFeesCents: number;
  overdueInvoiceCount: number;
  batches: DashboardBatchCard[];
  actionItems: DashboardActionItem[];
};

export async function fetchCenterDashboardHome(
  centerId: string,
  now: Date = new Date()
): Promise<CenterDashboardHome> {
  const sb = getSupabase();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    openLeadsRes,
    leadsTodayRes,
    qualifiedLeadRes,
    invoicesRes,
    batchRows,
    enrollmentRows,
    unseenJoins,
    centerRow,
  ] = await Promise.all([
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .in("status", ["new", "contacted", "qualified"]),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .gte("created_at", dayStart),
    sb
      .from("leads")
      .select("full_name, child_name")
      .eq("center_id", centerId)
      .eq("status", "qualified")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from("invoices").select("amount_cents, status").eq("center_id", centerId),
    fetchCenterBatches(centerId),
    sb.from("batch_enrollments").select("batch_id").eq("center_id", centerId),
    getCenterUnseenBatchJoins(centerId).catch(() => 0),
    sb.from("franchise_centers").select("brand_id").eq("id", centerId).maybeSingle(),
  ]);

  const feeStats = computeFeeCollectionRate(invoicesRes.data ?? []);
  const overdueInvoices = (invoicesRes.data ?? []).filter((i) => i.status === "overdue");

  const enrollmentByBatch = new Map<string, number>();
  for (const row of enrollmentRows.data ?? []) {
    const batchId = row.batch_id as string;
    enrollmentByBatch.set(batchId, (enrollmentByBatch.get(batchId) ?? 0) + 1);
  }

  const batches = sortDashboardBatches(
    batchRows.map((batch) =>
      buildDashboardBatchCard(batch, enrollmentByBatch.get(batch.id) ?? 0, now)
    )
  );

  let lowStockItems = 0;
  try {
    if (centerRow.data?.brand_id) {
      const inventoryRows = await fetchCenterInventorySummary(centerRow.data.brand_id, centerId);
      lowStockItems = countLowStockItems(inventoryRows, LOW_STOCK_THRESHOLD);
    }
  } catch {
    const { data: stock } = await sb.from("inventory_stock").select("quantity").eq("center_id", centerId);
    lowStockItems = (stock ?? []).filter((row) => (row.quantity ?? 0) <= LOW_STOCK_THRESHOLD).length;
  }

  try {
    await listCenterMerchandisePaymentAlerts(centerId);
  } catch {
    // optional feature
  }

  const leadDisplayName =
    qualifiedLeadRes.data?.child_name?.trim() ||
    qualifiedLeadRes.data?.full_name?.trim() ||
    null;

  const featuredBatchName = batches.find((b) => b.status === "live")?.name ?? batches[0]?.name ?? null;

  return {
    openLeads: openLeadsRes.count ?? 0,
    leadsToday: leadsTodayRes.count ?? 0,
    batchesToday: countBatchesToday(batchRows, now),
    nextBatchTime: findNextBatchTimeLabel(batchRows, now),
    pendingFeesCents: feeStats.overdueCents,
    overdueInvoiceCount: overdueInvoices.length,
    batches,
    actionItems: buildDashboardActionItems({
      qualifiedLeadName: leadDisplayName,
      overdueInvoiceCount: overdueInvoices.length,
      overdueBatchName: featuredBatchName,
      lowStockItems,
      unseenBatchJoins: unseenJoins,
    }),
  };
}
