import { describe, expect, it } from "vitest";
import type { LeadRow } from "@/lib/leadsApi";
import {
  filterLeads,
  filterTabOptions,
  leadCounts,
  leadListMeta,
  leadListTitle,
  leadSourcePresentation,
  leadStatusPresentation,
  leadsExportCsv,
  sortLeads,
  staleLeadInsight,
} from "./studentLeadsHelpers";

const NOW = new Date("2026-06-22T12:00:00Z").getTime();

function lead(overrides: Partial<LeadRow> = {}): LeadRow {
  return {
    id: "lead-1",
    brand_id: "brand-1",
    center_id: null,
    full_name: "Parent Name",
    parent_name: "Arti Rathi",
    email: "arti@gmail.com",
    whatsapp_e164: "+98989898",
    child_name: "Yug Rathi",
    child_dob: "2014-04-14",
    pincode: "411018",
    city: "Pune",
    school_name: null,
    status: "new",
    lead_source: "center",
    lost_reason: null,
    assigned_at: null,
    stale_at: null,
    last_center_action_at: null,
    created_at: "2026-06-15T18:09:36Z",
    ...overrides,
  };
}

describe("studentLeadsHelpers", () => {
  it("leadListTitle prefers parent_name", () => {
    expect(leadListTitle(lead())).toBe("Arti Rathi");
    expect(leadListTitle(lead({ parent_name: null, full_name: "Fallback" }))).toBe("Fallback");
  });

  it("leadListMeta joins phone and location", () => {
    expect(leadListMeta(lead())).toBe("+98989898 • Pune 411018");
  });

  it("leadCounts buckets leads by pipeline state", () => {
    const leads = [
      lead({ id: "1" }),
      lead({
        id: "2",
        center_id: "c1",
        status: "contacted",
        assigned_at: "2026-06-15T00:00:00Z",
        stale_at: "2026-06-20T00:00:00Z",
      }),
      lead({ id: "3", status: "lost" }),
      lead({ id: "4", status: "converted", center_id: "c2" }),
    ];
    expect(leadCounts(leads, NOW)).toEqual({
      unassigned: 1,
      stale: 1,
      lost: 1,
      converted: 1,
      all: 4,
    });
  });

  it("filterLeads and sortLeads apply view filters", () => {
    const leads = [
      lead({ id: "old", created_at: "2026-06-01T00:00:00Z" }),
      lead({ id: "new", created_at: "2026-06-20T00:00:00Z", status: "lost" }),
    ];
    expect(filterLeads(leads, "lost", NOW).map((row) => row.id)).toEqual(["new"]);
    expect(sortLeads(leads, "newest").map((row) => row.id)).toEqual(["new", "old"]);
  });

  it("presentation helpers map status and source badges", () => {
    expect(leadStatusPresentation(lead())).toEqual({ label: "NEW", tone: "new" });
    expect(leadSourcePresentation("center")).toEqual({ label: "CENTER", tone: "center" });
    expect(leadSourcePresentation(null)).toEqual({ label: "BRAND", tone: "brand" });
  });

  it("staleLeadInsight surfaces oldest stale lead copy", () => {
    const insight = staleLeadInsight([lead()], NOW);
    expect(insight?.leadName).toBe("Arti Rathi");
    expect(insight?.body).toContain("6 days");
    expect(insight?.body).toContain("24 hours");
  });

  it("filterTabOptions includes counts for tabs", () => {
    const options = filterTabOptions(leadCounts([lead()], NOW));
    expect(options.find((opt) => opt.value === "unassigned")?.count).toBe(1);
    expect(options.find((opt) => opt.value === "all")?.count).toBe(1);
  });

  it("leadsExportCsv emits header and escaped parent name", () => {
    const csv = leadsExportCsv([lead()]);
    expect(csv.split("\n")[0]).toBe("Parent,WhatsApp,Email,Child,City,Pincode,Status,Source,Created");
    expect(csv).toContain('"Arti Rathi"');
  });
});
