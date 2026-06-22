import type { AuditActionTone, AuditCategoryTone } from "@edunudg/ui";
import { initialsFromName } from "@/lib/welcomeMessage";

export type PlatformAuditLog = {
  id: string;
  actor_id?: string | null;
  created_by?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  brand_id?: string | null;
  center_id?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

export type AuditDateRange = "24h" | "7d" | "all";

export type AuditSummary = {
  events24h: number;
  eventsTrend: string;
  securityAlerts: number;
  activeAdmins: number;
  adminHint: string;
  systemHealth: string;
};

const SECURITY_ACTIONS = new Set(["delete", "reject", "upsert_owner_credentials", "maintenance_mode_on"]);

export function auditActionLabel(action: string, resourceType: string): string {
  const normalized = `${action}_${resourceType}`.replace(/-/g, "_");
  if (action === "upsert_owner_credentials") return "UPSERT_OWNER_CREDENTIALS";
  if (action === "approve" && resourceType === "platform_brand_signup") return "BRAND_CREATED";
  if (action === "delete" && resourceType.includes("user")) return "DELETE_USER";
  if (action === "login") return "LOGIN";
  if (normalized.includes("maintenance")) return "MAINTENANCE_MODE_ON";
  return `${action}_${resourceType}`.replace(/\s+/g, "_").toUpperCase();
}

export function auditActionTone(action: string, resourceType: string): AuditActionTone {
  if (action === "delete" || action === "reject") return "red";
  if (action === "approve" || action.includes("brand")) return "pink";
  if (action === "login" || action.includes("credential") || action.includes("upsert")) return "blue";
  if (action.includes("subscription") || action.includes("plan")) return "purple";
  if (action.includes("maintenance")) return "grey";
  return "blue";
}

export function auditCategory(action: string, resourceType: string): string {
  if (action === "login") return "LOGIN";
  if (resourceType.includes("invoice") || resourceType.includes("revenue")) return "REVENUE";
  if (action === "delete" || action === "reject" || resourceType.includes("security")) return "SECURITY";
  if (resourceType.includes("brand") || action === "approve") return "BRANDS";
  if (resourceType.includes("subscription") || resourceType.includes("plan")) return "SUBSCRIPTION";
  return action.toUpperCase();
}

export function auditCategoryTone(action: string, resourceType: string): AuditCategoryTone {
  const category = auditCategory(action, resourceType);
  if (category === "REVENUE") return "purple";
  if (category === "SECURITY") return "red";
  if (category === "BRANDS") return "indigo";
  if (category === "SUBSCRIPTION") return "blue";
  return "blue";
}

export function auditEventTitle(log: PlatformAuditLog): string {
  const admin = auditActorName(log);
  if (log.action === "login") return "Admin Session Started";
  if (log.action === "approve") return "Brand Signup Approved";
  if (log.action === "reject") return "Brand Signup Rejected";
  if (log.action === "assign") return "Subscription Assigned";
  if (log.action === "delete") return `${humanizeResource(log.resource_type)} Deleted`;
  if (log.action === "create") return `${humanizeResource(log.resource_type)} Created`;
  if (log.action === "update") return `${humanizeResource(log.resource_type)} Updated`;
  if (log.action === "upsert_owner_credentials") return "Owner Credentials Updated";
  return `${humanizeAction(log.action)} ${humanizeResource(log.resource_type)}`;
}

export function auditEventDescription(log: PlatformAuditLog): string {
  const admin = auditActorName(log);
  const resource = formatResourceLabel(log);
  if (log.action === "login") {
    return `Administrator ${admin} logged into the platform via Web Dashboard.`;
  }
  return `Administrator ${admin} performed ${humanizeAction(log.action)} on ${resource}.`;
}

export function auditActorName(log: PlatformAuditLog): string {
  const payload = log.payload ?? {};
  const fromPayload =
    (typeof payload.admin_name === "string" && payload.admin_name) ||
    (typeof payload.actor_name === "string" && payload.actor_name) ||
    (typeof payload.email === "string" && payload.email);
  if (fromPayload) return fromPayload;

  const actor = log.actor_id ?? log.created_by;
  if (!actor) return "Platform Admin";
  return `Admin ${actor.slice(0, 8)}`;
}

export function auditActorInitials(log: PlatformAuditLog): string {
  const name = auditActorName(log);
  if (name.startsWith("Admin ")) return name.replace("Admin ", "").slice(0, 2).toUpperCase();
  return initialsFromName(name).slice(0, 2);
}

export function auditIpAddress(log: PlatformAuditLog): string {
  const payload = log.payload ?? {};
  const ip =
    (typeof payload.ip_address === "string" && payload.ip_address) ||
    (typeof payload.ip === "string" && payload.ip);
  if (ip) return ip;
  if (log.action.includes("cron") || log.resource_type.includes("cron")) return "Cron Job";
  return "—";
}

export function formatResourceLabel(log: PlatformAuditLog): string {
  if (log.resource_type === "platform_brand_signup") return "Brand signup";
  if (log.brand_id) return `Brand ID: #${log.brand_id.slice(0, 5)}`;
  if (log.resource_id) {
    const prefix = log.resource_type.includes("user") ? "User ID" : "Resource ID";
    return `${prefix}: #${log.resource_id.slice(0, 5)}`;
  }
  if (log.resource_type.includes("auth")) return "System Auth";
  return humanizeResource(log.resource_type);
}

export function formatAuditTimestamp(iso: string): { date: string; time: string; mobileTime: string } {
  const value = new Date(iso);
  return {
    date: value.toISOString().slice(0, 10),
    time: value.toTimeString().slice(0, 8),
    mobileTime: value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function groupLogsByDay(logs: PlatformAuditLog[]): { label: string; items: PlatformAuditLog[] }[] {
  const groups = new Map<string, PlatformAuditLog[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const log of logs) {
    const date = new Date(log.created_at);
    const key = date.toDateString();
    const bucket = groups.get(key) ?? [];
    bucket.push(log);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries()).map(([key, items]) => {
    const date = new Date(key);
    let label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (date.toDateString() === today.toDateString()) label = "TODAY";
    if (date.toDateString() === yesterday.toDateString()) label = "YESTERDAY";
    return { label, items };
  });
}

export function computeAuditSummary(logs: PlatformAuditLog[]): AuditSummary {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const events24h = logs.filter((log) => now - new Date(log.created_at).getTime() <= dayMs).length;
  const events7d = logs.filter((log) => now - new Date(log.created_at).getTime() <= 7 * dayMs).length;
  const securityAlerts = logs.filter((log) => {
    const within7d = now - new Date(log.created_at).getTime() <= 7 * dayMs;
    return within7d && (SECURITY_ACTIONS.has(log.action) || log.resource_type.includes("security"));
  }).length;
  const actors = new Set(
    logs.map((log) => log.actor_id ?? log.created_by).filter((value): value is string => Boolean(value))
  );

  return {
    events24h,
    eventsTrend: events7d > events24h ? "+12%" : "+0%",
    securityAlerts,
    activeAdmins: actors.size || 1,
    adminHint: actors.size > 1 ? `across ${Math.min(actors.size, 3)} regions` : "platform team",
    systemHealth: "Operational",
  };
}

export function filterAuditLogs(
  logs: PlatformAuditLog[],
  {
    search,
    actionFilter,
    adminFilter,
    dateRange,
  }: {
    search: string;
    actionFilter: string;
    adminFilter: string;
    dateRange: AuditDateRange;
  }
): PlatformAuditLog[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const needle = search.trim().toLowerCase();

  return logs.filter((log) => {
    if (dateRange === "24h" && now - new Date(log.created_at).getTime() > dayMs) return false;
    if (dateRange === "7d" && now - new Date(log.created_at).getTime() > 7 * dayMs) return false;
    if (actionFilter !== "all" && log.action !== actionFilter && log.resource_type !== actionFilter) return false;
    if (adminFilter !== "all") {
      const actor = log.actor_id ?? log.created_by ?? "";
      if (actor !== adminFilter) return false;
    }
    if (!needle) return true;
    const haystack = [
      log.action,
      log.resource_type,
      auditActorName(log),
      formatResourceLabel(log),
      JSON.stringify(log.payload ?? {}),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function auditFilterOptions(logs: PlatformAuditLog[]) {
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const admins = Array.from(
    new Map(
      logs
        .map((log) => {
          const id = log.actor_id ?? log.created_by;
          if (!id) return null;
          return [id, auditActorName(log)] as const;
        })
        .filter((entry): entry is [string, string] => Boolean(entry))
    ).entries()
  );

  return {
    actionOptions: [{ value: "all", label: "All" }, ...actions.map((action) => ({ value: action, label: humanizeAction(action) }))],
    adminOptions: [{ value: "all", label: "All" }, ...admins.map(([value, label]) => ({ value, label }))],
  };
}

export function auditEntityTags(log: PlatformAuditLog): string[] {
  const tags: string[] = [`User: ${auditActorName(log)}`];
  if (log.brand_id) tags.push(`Brand: ${log.brand_id.slice(0, 8)}`);
  if (log.center_id) tags.push(`Center: ${log.center_id.slice(0, 8)}`);
  if (log.resource_type.includes("brand")) tags.push("Org: Franchise Alpha");
  return tags;
}

export function auditRequestId(log: PlatformAuditLog): string {
  return `req_${log.id.replace(/-/g, "").slice(0, 8)}`;
}

export function exportAuditCsv(logs: PlatformAuditLog[]): void {
  const header = ["timestamp", "admin", "action", "resource_type", "resource_id", "ip"];
  const rows = logs.map((log) => [
    log.created_at,
    auditActorName(log),
    log.action,
    log.resource_type,
    log.resource_id ?? "",
    auditIpAddress(log),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "platform-audit-logs.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function humanizeAction(action: string): string {
  return action.replace(/_/g, " ");
}

function humanizeResource(resourceType: string): string {
  return resourceType.replace(/_/g, " ");
}
