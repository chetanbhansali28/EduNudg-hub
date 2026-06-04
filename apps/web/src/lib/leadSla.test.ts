import { describe, expect, it } from "vitest";
import { isIndiaPincode, isLeadStale, leadAgeDays } from "@/lib/leadSla";
import type { LeadRow } from "@/lib/leadsApi";

const baseLead: Pick<
  LeadRow,
  "center_id" | "assigned_at" | "stale_at" | "last_center_action_at" | "status" | "created_at"
> = {
  center_id: "c1",
  assigned_at: "2026-05-01T00:00:00Z",
  stale_at: "2026-05-16T00:00:00Z",
  last_center_action_at: null,
  status: "new",
  created_at: "2026-05-01T00:00:00Z",
};

describe("isLeadStale", () => {
  const now = new Date("2026-05-20T00:00:00Z").getTime();

  it("regression_stale_when_past_stale_at_and_no_center_action", () => {
    expect(isLeadStale(baseLead, now)).toBe(true);
  });

  it("regression_not_stale_when_center_updated_status_after_assign", () => {
    expect(
      isLeadStale(
        {
          ...baseLead,
          last_center_action_at: "2026-05-10T00:00:00Z",
        },
        now
      )
    ).toBe(false);
  });

  it("regression_not_stale_when_unassigned", () => {
    expect(isLeadStale({ ...baseLead, center_id: null }, now)).toBe(false);
  });

  it("regression_not_stale_before_stale_at", () => {
    expect(isLeadStale(baseLead, new Date("2026-05-10T00:00:00Z").getTime())).toBe(false);
  });
});

describe("leadAgeDays", () => {
  it("computes whole days since created", () => {
    const now = new Date("2026-06-04T12:00:00Z").getTime();
    expect(leadAgeDays("2026-06-01T00:00:00Z", now)).toBe(3);
  });
});

describe("isIndiaPincode", () => {
  it("accepts 6 digits", () => {
    expect(isIndiaPincode("560001")).toBe(true);
  });

  it("rejects non-India formats", () => {
    expect(isIndiaPincode("56001")).toBe(false);
    expect(isIndiaPincode("5600012")).toBe(false);
  });
});
