import { describe, expect, it } from "vitest";
import {
  buildLeadTimeline,
  computeLeadPipelineStats,
  filterCenterLeads,
  formatLeadContactWhen,
  leadStatusPresentation,
  leadStudentInterest,
  paginateItems,
  paginationLabel,
} from "@/lib/centerLeadsHelpers";
import type { LeadRow } from "@/lib/leadsApi";

const sampleLead = (overrides: Partial<LeadRow> = {}): LeadRow => ({
  id: "lead-1",
  brand_id: "brand-1",
  center_id: "center-1",
  full_name: "Meera Reddy",
  parent_name: "Meera Reddy",
  email: "meera@example.com",
  whatsapp_e164: "+919876543210",
  child_name: "Abacus Level 1",
  child_dob: null,
  pincode: "560034",
  city: "Bengaluru",
  school_name: null,
  status: "contacted",
  lead_source: "instagram",
  lost_reason: null,
  assigned_at: "2026-06-10T10:00:00Z",
  stale_at: null,
  last_center_action_at: "2026-06-15T10:30:00Z",
  created_at: "2026-06-01T08:00:00Z",
  ...overrides,
});

describe("centerLeadsHelpers", () => {
  it("paginateItems and paginationLabel format ranges", () => {
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(paginateItems(items, 1, 10)).toHaveLength(10);
    expect(paginationLabel(124, 1, 10)).toBe("Showing 1-10 of 124 leads");
  });

  it("computeLeadPipelineStats counts open lost converted stale", () => {
    const stats = computeLeadPipelineStats([
      sampleLead(),
      sampleLead({ id: "lead-2", status: "lost" }),
      sampleLead({ id: "lead-3", status: "converted" }),
    ]);
    expect(stats.open).toBe(1);
    expect(stats.lost).toBe(1);
    expect(stats.converted).toBe(1);
  });

  it("filterCenterLeads applies tab and search", () => {
    const leads = [
      sampleLead(),
      sampleLead({
        id: "lead-2",
        full_name: "Other Parent",
        parent_name: "Other Parent",
        email: "other@example.com",
        status: "lost",
      }),
    ];
    expect(filterCenterLeads(leads, "open", "").length).toBe(1);
    expect(filterCenterLeads(leads, "all", "meera").length).toBe(1);
  });

  it("leadStatusPresentation maps contacted and stale hot lead", () => {
    expect(leadStatusPresentation(sampleLead()).label).toBe("Contacted");
    expect(
      leadStatusPresentation(
        sampleLead({ stale_at: "2020-01-01T00:00:00Z", last_center_action_at: null }),
        Date.parse("2026-06-15T12:00:00Z")
      ).tone
    ).toBe("hot");
  });

  it("formatLeadContactWhen renders today with time", () => {
    const now = new Date("2026-06-15T14:00:00Z").getTime();
    const label = formatLeadContactWhen("2026-06-15T10:30:00Z", now).label;
    expect(label).toContain("Today");
  });

  it("buildLeadTimeline includes created and action entries", () => {
    const items = buildLeadTimeline(sampleLead());
    expect(items.some((item) => item.title === "Called Parent")).toBe(true);
    expect(items.some((item) => item.title === "Lead Created")).toBe(true);
  });

  it("leadStudentInterest uses child name and status subtitle", () => {
    expect(leadStudentInterest(sampleLead({ status: "qualified" })).subtitle).toBe("Trial pending");
  });
});
