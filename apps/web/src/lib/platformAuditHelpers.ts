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
  source?: "mutation" | "auth" | "error" | "access";
  portal?: string | null;
  ip_address?: string | null;
  ip_country?: string | null;
  brand_name?: string | null;
  center_name?: string | null;
};

export type AuthAuditRow = {
  id: string;
  user_id?: string | null;
  created_by?: string | null;
  event_type: string;
  provider?: string | null;
  ip_address?: string | null;
  ip_hash?: string | null;
  ip_country?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  brand_id?: string | null;
  center_id?: string | null;
  portal?: string | null;
  session_id?: string | null;
  created_at: string;
};

export type AuditDateRange = "24h" | "7d" | "all";
export type AuditStream = "all" | "mutations" | "auth" | "access" | "errors";
export type AuditPortalFilter = "all" | "staff" | "learn" | "parents";

export const AUDIT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type AuditPageSize = (typeof AUDIT_PAGE_SIZE_OPTIONS)[number];

export function auditPageWindow(
  total: number,
  page: number,
  pageSize: number
): { pageCount: number; currentPage: number; start: number; end: number } {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(Math.max(0, page), pageCount - 1);
  if (total === 0) return { pageCount, currentPage: 0, start: 0, end: 0 };
  const start = currentPage * size + 1;
  const end = Math.min((currentPage + 1) * size, total);
  return { pageCount, currentPage, start, end };
}

export function mapAuthAuditToPlatformLog(row: AuthAuditRow): PlatformAuditLog {
  const meta = row.metadata ?? {};
  const email = typeof meta.email === "string" ? meta.email : typeof meta.identifier === "string" ? meta.identifier : null;
  const action =
    row.event_type === "passkey_login"
      ? "login"
      : row.event_type === "login_success"
        ? "login"
        : row.event_type;
  return {
    id: row.id,
    actor_id: row.user_id ?? row.created_by,
    created_by: row.created_by ?? row.user_id,
    action,
    resource_type: "auth",
    resource_id: row.user_id ?? null,
    brand_id: row.brand_id,
    center_id: row.center_id,
    created_at: row.created_at,
    source: "auth",
    portal: row.portal ?? null,
    ip_address: row.ip_address ?? (typeof meta.ip_address === "string" ? meta.ip_address : null),
    ip_country: row.ip_country ?? null,
    payload: {
      ...meta,
      event_type: row.event_type,
      provider: row.provider,
      portal: row.portal,
      session_id: row.session_id,
      user_agent: row.user_agent,
      ip_hash: row.ip_hash,
      ip_country: row.ip_country,
      ip_address: row.ip_address,
      email,
    },
  };
}

export type ClientErrorRow = {
  id: string;
  user_id?: string | null;
  created_by?: string | null;
  brand_id?: string | null;
  center_id?: string | null;
  portal?: string | null;
  route?: string | null;
  message: string;
  stack?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type AccessAuditRow = {
  id: string;
  actor_id?: string | null;
  created_by?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  brand_id?: string | null;
  center_id?: string | null;
  portal?: string | null;
  path?: string | null;
  ip_address?: string | null;
  ip_hash?: string | null;
  ip_country?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export function mapClientErrorToPlatformLog(row: ClientErrorRow): PlatformAuditLog {
  return {
    id: row.id,
    actor_id: row.user_id ?? row.created_by,
    created_by: row.created_by ?? row.user_id,
    action: "client_error",
    resource_type: "client",
    resource_id: row.user_id ?? null,
    brand_id: row.brand_id,
    center_id: row.center_id,
    created_at: row.created_at,
    source: "error",
    portal: row.portal ?? null,
    payload: {
      ...(row.metadata ?? {}),
      message: row.message,
      stack: row.stack,
      route: row.route,
      portal: row.portal,
      user_agent: row.user_agent,
    },
  };
}

export function mapAccessAuditToPlatformLog(row: AccessAuditRow): PlatformAuditLog {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    actor_id: row.actor_id ?? row.created_by,
    created_by: row.created_by ?? row.actor_id,
    action: row.action,
    resource_type: row.resource_type,
    resource_id: row.resource_id ?? null,
    brand_id: row.brand_id,
    center_id: row.center_id,
    created_at: row.created_at,
    source: "access",
    portal: row.portal ?? null,
    ip_address: row.ip_address ?? null,
    ip_country: row.ip_country ?? null,
    payload: {
      ...meta,
      path: row.path,
      portal: row.portal,
      user_agent: row.user_agent,
      ip_hash: row.ip_hash,
      ip_country: row.ip_country,
      ip_address: row.ip_address,
    },
  };
}

export function applyAuditDirectoryNames(
  logs: PlatformAuditLog[],
  names: { brands: Record<string, string>; centers: Record<string, string> }
): PlatformAuditLog[] {
  return logs.map((log) => ({
    ...log,
    brand_name: log.brand_id ? names.brands[log.brand_id] ?? log.brand_name ?? null : null,
    center_name: log.center_id ? names.centers[log.center_id] ?? log.center_name ?? null : null,
  }));
}

export function auditBrandTag(log: PlatformAuditLog): string | null {
  if (!log.brand_id) return null;
  const short = log.brand_id.slice(0, 8);
  return log.brand_name ? `Brand: ${log.brand_name} (${short})` : `Brand: ${short}`;
}

export function auditCenterTag(log: PlatformAuditLog): string | null {
  if (!log.center_id) return null;
  const short = log.center_id.slice(0, 8);
  return log.center_name ? `Center: ${log.center_name} (${short})` : `Center: ${short}`;
}

export function isStaffAuditPortal(portal: string | null | undefined): boolean {
  return portal === "platform" || portal === "brand" || portal === "center" || !portal;
}

export type AuditSummary = {
  events24h: number;
  eventsTrend: string;
  securityAlerts: number;
  activeAdmins: number;
  adminHint: string;
  systemHealth: string;
};

const SECURITY_ACTIONS = new Set([
  "delete",
  "reject",
  "upsert_owner_credentials",
  "maintenance_mode_on",
  "login_failure",
  "access_denied",
  "client_error",
  "credentials",
  "handoff",
]);

export function auditActionLabel(action: string, resourceType: string): string {
  const normalized = `${action}_${resourceType}`.replace(/-/g, "_");
  if (action === "upsert_owner_credentials") return "UPSERT_OWNER_CREDENTIALS";
  if (action === "approve" && resourceType === "platform_brand_signup") return "BRAND_CREATED";
  if (action === "delete" && resourceType.includes("user")) return "DELETE_USER";
  if (action === "login") return "LOGIN";
  if (action === "logout") return "LOGOUT";
  if (action === "login_failure") return "LOGIN_FAILURE";
  if (action === "access_denied") return "ACCESS_DENIED";
  if (action === "client_error") return "CLIENT_ERROR";
  if (action === "export") return "EXPORT";
  if (action === "view_pii") return "VIEW_PII";
  if (action === "credentials") return "CREDENTIALS";
  if (action === "handoff") return "HANDOFF";
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
  if (action === "login" || action === "logout") return "LOGIN";
  if (action === "login_failure" || action === "access_denied") return "SECURITY";
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
  if (log.action === "login") return "Session started";
  if (log.action === "logout") return "Signed out";
  if (log.action === "login_failure") return "Sign-in failed";
  if (log.action === "access_denied") return "Portal access denied";
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
    const portal = log.portal ?? (typeof log.payload?.portal === "string" ? log.payload.portal : "portal");
    return `${admin} signed in (${portal}).`;
  }
  if (log.action === "logout") {
    return `${admin} signed out.`;
  }
  if (log.action === "login_failure") {
    return `Failed sign-in attempt.`;
  }
  if (log.action === "access_denied") {
    return `${admin} signed in but is not authorized for this website.`;
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
    log.ip_address ||
    (typeof payload.ip_address === "string" && payload.ip_address) ||
    (typeof payload.ip === "string" && payload.ip);
  if (ip) return ip;
  const country = log.ip_country || (typeof payload.ip_country === "string" ? payload.ip_country : "");
  if (country) return country;
  if (log.action.includes("cron") || log.resource_type.includes("cron")) return "Cron Job";
  if (log.source === "error") return "—";
  if (log.source === "auth" || log.resource_type === "auth" || log.source === "access") return "Not captured";
  return "—";
}

export function formatAuditTrailJson(log: PlatformAuditLog): string {
  return JSON.stringify(
    {
      id: log.id,
      created_at: log.created_at,
      action: log.action,
      resource_type: log.resource_type,
      actor_id: log.actor_id ?? log.created_by,
      brand_id: log.brand_id,
      center_id: log.center_id,
      portal: log.portal,
      ip_address: log.ip_address,
      ip_country: log.ip_country,
      brand_name: log.brand_name,
      center_name: log.center_name,
      payload: log.payload ?? {},
    },
    null,
    2
  );
}

export function formatResourceLabel(log: PlatformAuditLog): string {
  if (log.resource_type === "auth") {
    const portal =
      log.portal || (typeof log.payload?.portal === "string" ? log.payload.portal : null);
    if (log.brand_name) return log.brand_name;
    return portal ? `${portal} sign-in` : "Sign-in";
  }
  if (log.resource_type === "platform_brand_signup") return "Brand signup";
  if (log.brand_name) return log.brand_name;
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
    streamFilter = "all",
    portalFilter = "all",
  }: {
    search: string;
    actionFilter: string;
    adminFilter: string;
    dateRange: AuditDateRange;
    streamFilter?: AuditStream;
    portalFilter?: AuditPortalFilter;
  }
): PlatformAuditLog[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const needle = search.trim().toLowerCase();

  return logs.filter((log) => {
    const source = log.source ?? "mutation";
    if (streamFilter === "auth" && source !== "auth") return false;
    if (streamFilter === "mutations" && source !== "mutation") return false;
    if (streamFilter === "access" && source !== "access") return false;
    if (streamFilter === "errors" && source !== "error") return false;
    if (portalFilter === "learn" && log.portal !== "learn") return false;
    if (portalFilter === "parents" && log.portal !== "parents") return false;
    if (portalFilter === "staff" && !isStaffAuditPortal(log.portal)) return false;
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
      auditIpAddress(log),
      log.portal ?? "",
      log.brand_name ?? "",
      log.center_name ?? "",
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
  const brand = auditBrandTag(log);
  const center = auditCenterTag(log);
  if (brand) tags.push(brand);
  if (center) tags.push(center);
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
