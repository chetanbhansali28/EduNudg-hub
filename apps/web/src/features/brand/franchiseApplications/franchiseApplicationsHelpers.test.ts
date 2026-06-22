import { describe, expect, it } from "vitest";
import {
  filterInquiries,
  formatInquiryRelativeWhen,
  inquiryCounts,
  inquiryListTitle,
  inquiryLocationLine,
  inquiryStatusPresentation,
  isPendingInquiry,
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
    expect(inquiryCounts(rows)).toEqual({ pending: 1, decided: 1, all: 2 });
  });

  it("maps inquiry status presentation", () => {
    expect(inquiryStatusPresentation(base)).toEqual({ label: "NEW", tone: "new" });
    expect(inquiryStatusPresentation({ ...base, status: "contacted" }).tone).toBe("pending");
    expect(isPendingInquiry({ ...base, status: "qualified" })).toBe(true);
    expect(inquiryLocationLine(base)).toBe("Pune, Maharashtra");
  });
});
