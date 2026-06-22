import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { CenterLeadsPage } from "./CenterLeadsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    centerId: "center-1",
    brandId: "brand-1",
    centerSlug: "koramangala",
    brandSlug: "abacus",
  }),
}));

vi.mock("@/features/shared/manualLeads/ManualStudentLeadCard", () => ({
  ManualStudentLeadCard: () => <div>Add student lead manually</div>,
}));

const sampleLead = {
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
};

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [sampleLead], error: null }),
        }),
      }),
    }),
  }),
}));

describe("CenterLeadsPage", () => {
  it("regression_center_leads_pipeline_workspace_theme", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Leads")).toBeDefined();
    expect(screen.getByText(/Call parents on WhatsApp/i)).toBeDefined();
    expect(await screen.findByText("Open Pipeline")).toBeDefined();
    expect(await screen.findByText("Meera Reddy")).toBeDefined();
    expect(screen.getByRole("link", { name: "+919876543210" }).getAttribute("href")).toBe("tel:+919876543210");
    expect(screen.getByRole("tablist", { name: "Lead filter" })).toBeDefined();
    expect(await screen.findByText("Showing 1-1 of 1 leads")).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
  });

  it("regression_center_leads_add_lead_opens_form_and_scrolls", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.queryByRole("button", { name: /Filter/i })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /\+ Add Lead/i }));
    await waitFor(() => {
      expect(screen.getByText("Add student lead manually")).toBeDefined();
      expect(document.getElementById("center-add-student-lead")).toBeTruthy();
    });
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });
});
