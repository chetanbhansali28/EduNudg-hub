import { describe, expect, it, vi, beforeEach } from "vitest";
import { logPlatformAudit } from "./platformAuditApi";

const insertMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    auth: { getSession: getSessionMock },
    from: (table: string) => ({
      insert: insertMock.mockImplementation((row) => {
        expect(table).toBe("platform_audit_logs");
        expect(row.action).toBe("assign");
        return Promise.resolve({ error: null });
      }),
    }),
  }),
}));

describe("platformAuditApi", () => {
  beforeEach(() => {
    insertMock.mockClear();
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: "admin-1" } } } });
  });

  it("logPlatformAudit inserts append-only row for platform admin", async () => {
    await logPlatformAudit({
      action: "assign",
      resource_type: "brand_subscription",
      brand_id: "brand-1",
      payload: { plan_id: "plan-1" },
    });
    expect(insertMock).toHaveBeenCalledOnce();
  });
});
