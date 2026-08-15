import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FranchiseInquiryDetailCard, type FranchiseInquiry } from "./FranchiseInquiryDetailCard";

const inquiry: FranchiseInquiry = {
  id: "inq-1",
  full_name: "Priya Sharma",
  email: "priya@example.com",
  phone_e164: "+919876543210",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  address_line: "42 FC Road",
  proposed_franchise_name: "Abacus Pune West",
  prior_experience: "Tutoring background",
  message: "Ready to invest",
  status: "new",
  rejected_reason: null,
  converted_center_id: null,
  created_at: "2026-06-01T10:00:00Z",
  updated_at: "2026-06-01T10:00:00Z",
};

describe("FranchiseInquiryDetailCard", () => {
  it("shows all application fields and approve flow without slug inputs", () => {
    const onApprove = vi.fn();

    render(
      <FranchiseInquiryDetailCard
        inquiry={inquiry}
        pending
        onApprove={onApprove}
        onReject={vi.fn()}
        rejectMode={false}
        rejectReason=""
        onRejectReasonChange={vi.fn()}
        onConfirmReject={vi.fn()}
        onCancelAction={vi.fn()}
        approvePending={false}
        rejectPending={false}
      />
    );

    expect(screen.getAllByText("Abacus Pune West").length).toBeGreaterThan(0);
    expect(screen.getByText("Proposed Center Details")).toBeDefined();
    expect(screen.getByText("Applicant Information")).toBeDefined();
    expect(screen.getByText("Tutoring background")).toBeDefined();
    expect(screen.getByRole("link", { name: "+919876543210" }).getAttribute("href")).toBe("tel:+919876543210");
    expect(screen.queryByLabelText("Center slug (optional)")).toBeNull();
    expect(screen.getByText(/maps a subdomain under your brand domain/i)).toBeDefined();
    expect(screen.queryByText(/\{center\}\.\{brand\}/)).toBeNull();
    expect(screen.getByTitle(/Google Map for Pune, Maharashtra/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Approve & create center" }));
    expect(onApprove).toHaveBeenCalled();
  });

  it("regression_deleted_converted_center_explains_history_keep", () => {
    render(
      <FranchiseInquiryDetailCard
        inquiry={{
          ...inquiry,
          status: "converted",
          converted_center_id: "center-gone",
        }}
        pending={false}
        convertedCenterDeleted
        onApprove={vi.fn()}
        onReject={vi.fn()}
        rejectMode={false}
        rejectReason=""
        onRejectReasonChange={vi.fn()}
        onConfirmReject={vi.fn()}
        onCancelAction={vi.fn()}
        approvePending={false}
        rejectPending={false}
      />
    );

    expect(screen.getByText(/deleted from Franchise Management/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approve & create center" })).toBeNull();
  });
});
