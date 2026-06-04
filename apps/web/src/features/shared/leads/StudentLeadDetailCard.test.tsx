import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StudentLeadDetailCard } from "./StudentLeadDetailCard";
import type { LeadRow } from "@/lib/leadsApi";

const lead: LeadRow = {
  id: "lead-1",
  brand_id: "brand-1",
  center_id: null,
  full_name: "Parent One",
  parent_name: "Parent One",
  email: "parent@example.com",
  whatsapp_e164: "+919876543210",
  child_name: "Aarav",
  child_dob: "2018-05-01",
  pincode: "560001",
  city: "Bengaluru",
  school_name: "DPS",
  status: "new",
  lead_source: "brand",
  lost_reason: null,
  assigned_at: null,
  stale_at: null,
  last_center_action_at: null,
  created_at: "2026-06-01T10:00:00Z",
};

describe("StudentLeadDetailCard", () => {
  it("regression_shows_lead_fields_and_action_slot", () => {
    const onAssign = vi.fn();

    render(
      <StudentLeadDetailCard
        lead={lead}
        unassigned
        ageDays={3}
        onClose={vi.fn()}
        actions={
          <button type="button" onClick={onAssign}>
            Assign
          </button>
        }
      />
    );

    expect(screen.getByText("Aarav")).toBeDefined();
    expect(screen.getByText("DPS")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));
    expect(onAssign).toHaveBeenCalled();
  });
});
