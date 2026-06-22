import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  auditActorName,
  auditEventTitle,
  computeAuditSummary,
  filterAuditLogs,
  formatAuditTimestamp,
  groupLogsByDay,
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

  it("groups logs by day labels", () => {
    const groups = groupLogsByDay([sampleLog()]);
    expect(groups[0]?.label).toBe("TODAY");
  });

  it("formats timestamps", () => {
    const ts = formatAuditTimestamp("2023-10-24T10:45:00.000Z");
    expect(ts.date).toBe("2023-10-24");
    expect(ts.mobileTime).toMatch(/AM|PM/);
  });
});
