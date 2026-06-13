import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { countStaleBrandLeads } from "@/lib/leadsApi";
import { getCenterUnseenBatchJoins } from "@/lib/centerBatchesApi";
import { listPendingPlatformSignups } from "@/lib/platformBrandSignupApi";
import { getSupabase } from "@/lib/supabase";
import { isLeadStale } from "@/lib/leadSla";
import type { LeadRow } from "@/lib/leadsApi";

export type ShellContextCounts = {
  pendingFranchiseApplications: number;
  unassignedStudentLeads: number;
  staleStudentLeads: number;
  openCenterLeads: number;
  staleCenterLeads: number;
  pendingBrandSignups: number;
  unseenBatchJoins: number;
};

const EMPTY_COUNTS: ShellContextCounts = {
  pendingFranchiseApplications: 0,
  unassignedStudentLeads: 0,
  staleStudentLeads: 0,
  openCenterLeads: 0,
  staleCenterLeads: 0,
  pendingBrandSignups: 0,
  unseenBatchJoins: 0,
};

function isPendingFranchiseStatus(status: string) {
  return status === "new" || status === "contacted" || status === "qualified";
}

async function fetchBrandContextCounts(brandId: string): Promise<Pick<
  ShellContextCounts,
  "pendingFranchiseApplications" | "unassignedStudentLeads" | "staleStudentLeads"
>> {
  const sb = getSupabase();
  const [inquiries, unassigned, stale] = await Promise.all([
    sb
      .from("franchise_inquiries")
      .select("status")
      .eq("brand_id", brandId),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .is("center_id", null)
      .not("status", "in", '("converted","lost")'),
    countStaleBrandLeads(brandId),
  ]);

  const pendingFranchiseApplications = (inquiries.data ?? []).filter((row) =>
    isPendingFranchiseStatus(row.status)
  ).length;

  return {
    pendingFranchiseApplications,
    unassignedStudentLeads: unassigned.count ?? 0,
    staleStudentLeads: stale,
  };
}

async function fetchCenterContextCounts(centerId: string): Promise<Pick<
  ShellContextCounts,
  "openCenterLeads" | "staleCenterLeads" | "unseenBatchJoins"
>> {
  const [{ data, error }, unseenBatchJoins] = await Promise.all([
    getSupabase()
      .from("leads")
      .select(
        "center_id, assigned_at, stale_at, last_center_action_at, status"
      )
      .eq("center_id", centerId),
    getCenterUnseenBatchJoins(centerId).catch(() => 0),
  ]);
  if (error) throw error;

  const now = Date.now();
  const rows = (data ?? []) as Pick<
    LeadRow,
    "center_id" | "assigned_at" | "stale_at" | "last_center_action_at" | "status"
  >[];

  const openCenterLeads = rows.filter((row) =>
    ["new", "contacted", "qualified"].includes(row.status)
  ).length;
  const staleCenterLeads = rows.filter((row) => isLeadStale(row, now)).length;

  return { openCenterLeads, staleCenterLeads, unseenBatchJoins };
}

async function fetchPlatformContextCounts(): Promise<Pick<ShellContextCounts, "pendingBrandSignups">> {
  const signups = await listPendingPlatformSignups();
  return { pendingBrandSignups: signups.length };
}

export function useShellContextCounts() {
  const tenant = useTenant();

  return useQuery({
    queryKey: ["shell-context-counts", tenant.portalType, tenant.brandId, tenant.centerId],
    enabled:
      tenant.portalType === "platform" ||
      (tenant.portalType === "brand" && !!tenant.brandId) ||
      (tenant.portalType === "center" && !!tenant.centerId),
    queryFn: async (): Promise<ShellContextCounts> => {
      if (tenant.portalType === "platform") {
        const platform = await fetchPlatformContextCounts();
        return { ...EMPTY_COUNTS, ...platform };
      }
      if (tenant.portalType === "brand" && tenant.brandId) {
        const brand = await fetchBrandContextCounts(tenant.brandId);
        return { ...EMPTY_COUNTS, ...brand };
      }
      if (tenant.portalType === "center" && tenant.centerId) {
        const center = await fetchCenterContextCounts(tenant.centerId);
        return { ...EMPTY_COUNTS, ...center };
      }
      return EMPTY_COUNTS;
    },
    staleTime: 60_000,
  });
}

/** Actionable subtitle hints for the shell header. */
export function shellActionHints(
  portalType: string,
  counts: ShellContextCounts | undefined
): string[] {
  if (!counts) return [];
  const hints: string[] = [];

  if (portalType === "brand") {
    if (counts.pendingFranchiseApplications > 0) {
      hints.push(
        `${counts.pendingFranchiseApplications} franchise application${counts.pendingFranchiseApplications === 1 ? "" : "s"} pending review`
      );
    }
    if (counts.unassignedStudentLeads > 0) {
      hints.push(
        `${counts.unassignedStudentLeads} unassigned student lead${counts.unassignedStudentLeads === 1 ? "" : "s"}`
      );
    }
    if (counts.staleStudentLeads > 0) {
      hints.push(
        `${counts.staleStudentLeads} lead${counts.staleStudentLeads === 1 ? "" : "s"} need attention`
      );
    }
  }

  if (portalType === "center") {
    if (counts.openCenterLeads > 0) {
      hints.push(`${counts.openCenterLeads} open lead${counts.openCenterLeads === 1 ? "" : "s"}`);
    }
    if (counts.staleCenterLeads > 0) {
      hints.push(`${counts.staleCenterLeads} lead${counts.staleCenterLeads === 1 ? "" : "s"} need attention`);
    }
    if (counts.unseenBatchJoins > 0) {
      hints.push(
        `${counts.unseenBatchJoins} student${counts.unseenBatchJoins === 1 ? "" : "s"} joined a batch`
      );
    }
  }

  if (portalType === "platform" && counts.pendingBrandSignups > 0) {
    hints.push(
      `${counts.pendingBrandSignups} brand signup${counts.pendingBrandSignups === 1 ? "" : "s"} pending review`
    );
  }

  return hints;
}
