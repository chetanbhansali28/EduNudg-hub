import type { LeadRow } from "@/lib/leadsApi";

/** FR-SLA / D5: stale when SLA elapsed and center never updated status since assignment. */
export function isLeadStale(lead: Pick<
  LeadRow,
  "center_id" | "assigned_at" | "stale_at" | "last_center_action_at" | "status"
>, nowMs: number = Date.now()): boolean {
  if (!lead.center_id) return false;
  if (lead.status === "converted" || lead.status === "lost") return false;
  if (!lead.stale_at) return false;
  if (new Date(lead.stale_at).getTime() >= nowMs) return false;

  if (!lead.last_center_action_at) return true;
  if (!lead.assigned_at) return true;

  return new Date(lead.last_center_action_at).getTime() < new Date(lead.assigned_at).getTime();
}

/** Days since lead was created (for unassigned queue age badge). */
export function leadAgeDays(createdAt: string, nowMs: number = Date.now()): number {
  const created = new Date(createdAt).getTime();
  return Math.max(0, Math.floor((nowMs - created) / (24 * 60 * 60 * 1000)));
}

/** India 6-digit pincode (v1). Non-India: suggestions disabled, manual assign only (B1). */
export function isIndiaPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}
