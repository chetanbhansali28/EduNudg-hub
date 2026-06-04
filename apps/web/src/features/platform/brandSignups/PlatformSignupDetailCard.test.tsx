import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlatformSignupDetailCard } from "./PlatformSignupDetailCard";
import type { PlatformSignupRow } from "@/lib/platformBrandSignupApi";

const signup: PlatformSignupRow = {
  id: "signup-1",
  requested_name: "Abacus World",
  admin_full_name: "Raj Patel",
  email: "raj@example.com",
  phone_e164: "+919876543210",
  city: "Mumbai",
  country: "IN",
  message: "Launching in Q3",
  status: "pending",
  proposed_slug: null,
  rejected_reason: null,
  created_at: "2026-06-01T10:00:00Z",
};

describe("PlatformSignupDetailCard", () => {
  it("regression_shows_signup_details_and_auto_slug_approve", () => {
    const onApprove = vi.fn();

    render(
      <PlatformSignupDetailCard
        signup={signup}
        onClose={vi.fn()}
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

    expect(screen.getByText("Launching in Q3")).toBeDefined();
    expect(screen.getByText(/slug is generated automatically/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Approve & create brand" }));
    expect(onApprove).toHaveBeenCalled();
  });
});
