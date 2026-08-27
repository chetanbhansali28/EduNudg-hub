import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  auditActorName,
  auditEventTitle,
  computeAuditSummary,
  filterAuditLogs,
  formatAuditTimestamp,
  groupLogsByDay,
  mapAuthAuditToPlatformLog,
  auditIpAddress,
  auditPageWindow,
  auditBrandTag,
  formatAuditTrailJson,
  type PlatformAuditLog,
} from "./platformAuditHelpers";

const sampleLog = (overrides: Partial<PlatformAuditLog> = {}): PlatformAuditLog => ({
  id: "log-1",
  action: "approve",
  resource_type: "platform_brand_signup",
  resource_id: "98221",
  created_at: new Date().toISOString(),
  payload: { admin_name: "Jane Doe" },
  ...overrides,
});

describe("platformAuditHelpers", () => {
  it("formats action labels and actor names", () => {
    const log = sampleLog();
    expect(auditActionLabel(log.action, log.resource_type)).toBe("BRAND_CREATED");
    expect(auditActorName(log)).toBe("Jane Doe");
    expect(auditEventTitle(log)).toContain("Brand");
  });

  it("computes audit summary metrics", () => {
    const summary = computeAuditSummary([
      sampleLog(),
      sampleLog({ id: "log-2", action: "delete", resource_type: "brand_subscription" }),
    ]);
    expect(summary.events24h).toBe(2);
    expect(summary.systemHealth).toBe("Operational");
  });

  it("filters logs by search and date range", () => {
    const logs = [
      sampleLog({ id: "a", action: "login", resource_type: "auth" }),
      sampleLog({ id: "b", action: "delete", resource_type: "brand_subscription" }),
    ];
    const filtered = filterAuditLogs(logs, {
      search: "login",
      actionFilter: "all",
      adminFilter: "all",
      dateRange: "all",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.action).toBe("login");
  });

  it("regression_auth_stream_filter_hides_mutations", () => {
    const logs: PlatformAuditLog[] = [
      sampleLog({ id: "a", action: "login", resource_type: "auth", source: "auth", portal: "learn" }),
      sampleLog({ id: "b", action: "delete", resource_type: "brand_subscription", source: "mutation" }),
    ];
    const authOnly = filterAuditLogs(logs, {
      search: "",
      actionFilter: "all",
      adminFilter: "all",
      dateRange: "all",
      streamFilter: "auth",
    });
    expect(authOnly).toHaveLength(1);
    expect(authOnly[0]?.id).toBe("a");

    const learnOnly = filterAuditLogs(logs, {
      search: "",
      actionFilter: "all",
      adminFilter: "all",
      dateRange: "all",
      streamFilter: "auth",
      portalFilter: "learn",
    });
    expect(learnOnly).toHaveLength(1);
  });

  it("maps auth_audit_logs rows into the platform audit table", () => {
    const mapped = mapAuthAuditToPlatformLog({
      id: "auth-1",
      user_id: "user-1",
      event_type: "login_success",
      portal: "brand",
      created_at: new Date().toISOString(),
      ip_address: "203.0.113.10",
      metadata: { email: "owner@example.com" },
    });
    expect(mapped.action).toBe("login");
    expect(mapped.source).toBe("auth");
    expect(mapped.portal).toBe("brand");
    expect(auditEventTitle(mapped)).toBe("Session started");
  });

  it("groups logs by day labels", () => {
    const groups = groupLogsByDay([sampleLog()]);
    expect(groups[0]?.label).toBe("TODAY");
  });

  it("formats timestamps", () => {
    const ts = formatAuditTimestamp("2023-10-24T10:45:00.000Z");
    expect(ts.date).toBe("2023-10-24");
    expect(ts.mobileTime).toMatch(/AM|PM/);
  });

  it("regression_auth_audit_ip_shows_not_captured_when_missing", () => {
    expect(
      auditIpAddress(
        sampleLog({ action: "login", resource_type: "auth", source: "auth", payload: {} })
      )
    ).toBe("Not captured");
  });

  it("regression_audit_brand_tag_includes_name", () => {
    expect(
      auditBrandTag(
        sampleLog({
          brand_id: "8db8ffa0-aaaa-bbbb-cccc-ddddeeeeffff",
          brand_name: "Spark Academy",
        })
      )
    ).toBe("Brand: Spark Academy (8db8ffa0)");
  });

  it("regression_audit_page_window_pages_1500_at_25", () => {
    const window = auditPageWindow(1500, 0, 25);
    expect(window.pageCount).toBe(60);
    expect(window.start).toBe(1);
    expect(window.end).toBe(25);
    expect(auditPageWindow(1500, 59, 25).start).toBe(1476);
    expect(auditPageWindow(1500, 59, 25).end).toBe(1500);
  });

  it("serializes a full audit trail JSON payload", () => {
    const json = formatAuditTrailJson(sampleLog({ id: "abc" }));
    expect(json).toContain('"id": "abc"');
    expect(json).toContain("platform_brand_signup");
  });

  it("regression_access_and_error_stream_filters", () => {
    const logs: PlatformAuditLog[] = [
      sampleLog({ id: "a", action: "login", resource_type: "auth", source: "auth" }),
      sampleLog({ id: "b", action: "export", resource_type: "franchise_csv", source: "access" }),
      sampleLog({ id: "c", action: "client_error", resource_type: "client", source: "error" }),
    ];
    expect(
      filterAuditLogs(logs, {
        search: "",
        actionFilter: "all",
        adminFilter: "all",
        dateRange: "all",
        streamFilter: "access",
      }).map((row) => row.id)
    ).toEqual(["b"]);
    expect(
      filterAuditLogs(logs, {
        search: "",
        actionFilter: "all",
        adminFilter: "all",
        dateRange: "all",
        streamFilter: "errors",
      }).map((row) => row.id)
    ).toEqual(["c"]);
  });
});
