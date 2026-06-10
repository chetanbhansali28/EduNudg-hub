import { getSupabase } from "@/lib/supabase";
import { listCenterMerchandisePaymentAlerts } from "@/lib/merchandiseRemindersApi";

export const LOW_STOCK_THRESHOLD = 5;

export interface CenterDashboardStats {
  batchCount: number;
  sessionsToday: number;
  attendanceRate7d: number | null;
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

function sevenDaysAgoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Computes attendance rate as present / total records (0–100). */
export function computeAttendanceRate(records: { present: boolean }[]): number | null {
  if (records.length === 0) return null;
  const present = records.filter((r) => r.present).length;
  return Math.round((present / records.length) * 100);
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
  const since = sevenDaysAgoDate();
  const today = todayDate();

  const [batches, sessionsToday, sessions7d, openLeads, pendingConversion, enrollments, invoices, stock] =
    await Promise.all([
      sb.from("batches").select("id", { count: "exact", head: true }).eq("center_id", centerId),
      sb
        .from("attendance_sessions")
        .select("id", { count: "exact", head: true })
        .eq("center_id", centerId)
        .eq("session_date", today),
      sb.from("attendance_sessions").select("id").eq("center_id", centerId).gte("session_date", since),
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
      sb.from("inventory_stock").select("quantity").eq("center_id", centerId),
    ]);

  const sessionIds = (sessions7d.data ?? []).map((s) => s.id as string);
  let attendanceRate7d: number | null = null;
  if (sessionIds.length > 0) {
    const { data: records } = await sb
      .from("attendance_records")
      .select("present")
      .eq("center_id", centerId)
      .in("session_id", sessionIds);
    attendanceRate7d = computeAttendanceRate(records ?? []);
  }

  const feeStats = computeFeeCollectionRate(invoices.data ?? []);
  const lowStockItems = (stock.data ?? []).filter((row) => (row.quantity ?? 0) <= LOW_STOCK_THRESHOLD).length;

  let merchandiseAlerts = { unpaid_count: 0, unpaid_total_cents: 0, overdue_count: 0 };
  try {
    merchandiseAlerts = await listCenterMerchandisePaymentAlerts(centerId);
  } catch {
    // merchandise feature may be off or RPC unavailable in tests
  }

  return {
    batchCount: batches.count ?? 0,
    sessionsToday: sessionsToday.count ?? 0,
    attendanceRate7d,
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
