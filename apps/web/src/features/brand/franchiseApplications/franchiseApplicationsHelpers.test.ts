import { describe, expect, it } from "vitest";
import {
  filterInquiries,
  formatInquiryRelativeWhen,
  inquiryCounts,
  inquiryListTitle,
  inquiryLocationLine,
  inquiryStatusPresentation,
  isDeletedConvertedInquiry,
  isPendingInquiry,
  mapsEmbedUrl,
  mapsSearchUrl,
} from "./franchiseApplicationsHelpers";
import type { FranchiseInquiry } from "./FranchiseInquiryDetailCard";

const base: FranchiseInquiry = {
  id: "inq-1",
  full_name: "Arti Patel",
  email: "arti@example.com",
  phone_e164: "+919876543210",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  address_line: "42 FC Road",
  proposed_franchise_name: "Arti Educon",
  prior_experience: "Not much experience",
  message: null,
  status: "new",
  rejected_reason: null,
  converted_center_id: null,
  created_at: "2026-06-22T08:00:00Z",
  updated_at: "2026-06-22T08:00:00Z",
};

describe("franchiseApplicationsHelpers", () => {
  it("regression_inquiry_list_title_prefers_proposed_name", () => {
    expect(inquiryListTitle(base)).toBe("Arti Educon");
    expect(inquiryListTitle({ ...base, proposed_franchise_name: null })).toBe("Arti Patel");
  });

  it("formats relative timestamps with hours", () => {
    const now = new Date("2026-06-22T10:00:00Z").getTime();
    expect(formatInquiryRelativeWhen("2026-06-22T08:00:00Z", now)).toBe("2 hours ago");
    expect(formatInquiryRelativeWhen("2026-06-21T10:00:00Z", now)).toBe("Yesterday");
  });

  it("filters by pending, decided, and search", () => {
    const decided: FranchiseInquiry = {
      ...base,
      id: "inq-2",
      status: "lost",
      proposed_franchise_name: "EduQuest Academy",
    };
    const rows = [base, decided];

    expect(filterInquiries(rows, "pending", "")).toHaveLength(1);
    expect(filterInquiries(rows, "decided", "")).toHaveLength(1);
    expect(filterInquiries(rows, "all", "eduquest")).toHaveLength(1);
    expect(filterInquiries(rows, "pending", "eduquest")).toHaveLength(1);
    expect(inquiryCounts(rows)).toEqual({ pending: 1, decided: 1, deleted: 0, all: 2 });
  });

  it("regression_search_finds_application_from_any_tab", () => {
    const decided: FranchiseInquiry = {
      ...base,
      id: "inq-2",
      status: "lost",
      full_name: "Ravi Kumar",
      email: "ravi@example.com",
      proposed_franchise_name: "EduQuest Academy",
    };
    expect(filterInquiries([base, decided], "pending", "EduQuest").map((row) => row.id)).toEqual(["inq-2"]);
    expect(filterInquiries([base, decided], "deleted", "arti").map((row) => row.id)).toEqual(["inq-1"]);
  });

  it("regression_deleted_converted_inquiry_uses_deleted_tab", () => {
    const approvedLive: FranchiseInquiry = {
      ...base,
      id: "inq-live",
      status: "converted",
      converted_center_id: "center-live",
      proposed_franchise_name: "Live Branch",
    };
    const approvedDeleted: FranchiseInquiry = {
      ...base,
      id: "inq-gone",
      status: "converted",
      converted_center_id: "center-gone",
      proposed_franchise_name: "Deleted Branch",
    };
    const rows = [base, approvedLive, approvedDeleted];
    const deletedIds = new Set(["center-gone"]);

    expect(isDeletedConvertedInquiry(approvedDeleted, deletedIds)).toBe(true);
    expect(inquiryStatusPresentation(approvedDeleted, deletedIds)).toEqual({
      label: "DELETED",
      tone: "deleted",
    });
    expect(inquiryStatusPresentation(approvedLive, deletedIds).tone).toBe("approved");
    expect(filterInquiries(rows, "decided", "", deletedIds).map((row) => row.id)).toEqual(["inq-live"]);
    expect(filterInquiries(rows, "deleted", "", deletedIds).map((row) => row.id)).toEqual(["inq-gone"]);
    expect(inquiryCounts(rows, deletedIds)).toEqual({ pending: 1, decided: 1, deleted: 1, all: 3 });
  });

  it("maps inquiry status presentation", () => {
    expect(inquiryStatusPresentation(base)).toEqual({ label: "NEW", tone: "new" });
    expect(inquiryStatusPresentation({ ...base, status: "contacted" }).tone).toBe("pending");
    expect(isPendingInquiry({ ...base, status: "qualified" })).toBe(true);
    expect(inquiryLocationLine(base)).toBe("Pune, Maharashtra");
  });

  it("builds google maps search and embed urls from location fields", () => {
    expect(mapsSearchUrl(base)).toContain("google.com/maps/search");
    expect(mapsSearchUrl(base)).toContain(encodeURIComponent("42 FC Road, Pune, Maharashtra, 411001"));
    expect(mapsEmbedUrl(base)).toContain("maps.google.com/maps");
    expect(mapsEmbedUrl(base)).toContain("output=embed");
    expect(mapsEmbedUrl({ ...base, address_line: null, city: null, state: null, pincode: null })).toBeNull();
  });
});
