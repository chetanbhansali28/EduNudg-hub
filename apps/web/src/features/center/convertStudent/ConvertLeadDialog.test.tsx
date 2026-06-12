import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import type { LeadRow } from "@/lib/leadsApi";

const lead: LeadRow = {
  id: "lead-1",
  brand_id: "brand-1",
  center_id: "center-1",
  full_name: "Parent Name",
  parent_name: "Parent Name",
  email: "parent@example.com",
  whatsapp_e164: "+919876543210",
  child_name: "Child Name",
  child_dob: "2015-01-01",
  pincode: "560034",
  city: "Bengaluru",
  school_name: "Local School",
  status: "contacted",
  lead_source: "center",
  lost_reason: null,
  assigned_at: null,
  stale_at: null,
  last_center_action_at: null,
  created_at: new Date().toISOString(),
};

describe("ConvertLeadDialog", () => {
  it("regression_inline_quick_confirm_without_duplicate_field_form", () => {
    const onConfirm = vi.fn();
    render(
      <ConvertLeadDialog
        lead={lead}
        variant="inline"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByText(/Create a student enrollment using the lead details/i)).toBeDefined();
    expect(screen.queryByLabelText("Parent name")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Create student enrollment/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ parentName: "Parent Name", childName: "Child Name" })
    );
  });
});
