import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
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
  ManualStudentLeadCard: ({ open }: { open: boolean }) =>
    open ? <div>Add student lead manually</div> : null,
}));

vi.mock("@/features/center/leads/CenterStudentLeadImportDialog", () => ({
  CenterStudentLeadImportDialog: ({ open }: { open: boolean }) =>
    open ? <div>Import student leads dialog</div> : null,
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
    const { container } = render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Leads")).toBeDefined();
    expect(screen.getByText(/Call parents on WhatsApp/i)).toBeDefined();
    expect(container.querySelector(".ed-lead-kpi-grid")).toBeTruthy();
    const kpiLabels = [...container.querySelectorAll(".ed-lead-kpi__label")].map((el) => el.textContent);
    expect(kpiLabels).toEqual(["Open", "Converted", "Lost", "Total"]);
    expect(screen.getByLabelText("Search leads")).toBeDefined();
    expect(await screen.findByText("Meera Reddy")).toBeDefined();
    expect(screen.getByText("CONTACTED")).toBeDefined();
    expect(screen.getByText("Bengaluru 560034")).toBeDefined();
    expect(screen.getByText("01/06/2026")).toBeDefined();
    expect(screen.queryByText("Parent Name")).toBeNull();
    expect(document.querySelector(".ed-pipeline-table-head")).toBeNull();
    expect(document.querySelector(".ed-franchise-app-list-item")).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Lead filter" })).toBeDefined();
    expect(await screen.findByText("Showing 1-1 of 1 leads")).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
  });

  it("regression_center_leads_detail_has_top_padding", () => {
    const css = readFileSync(resolve(__dirname, "centerLeads.css"), "utf8");
    expect(css).toMatch(/\.ed-center-leads-page \.ed-pipeline-detail-panel__head \{[\s\S]*padding-top:\s*1\.5rem/);
    expect(css).toMatch(/\.ed-center-leads-page \.ed-pipeline-detail-panel__body \{[\s\S]*padding-top:\s*1\.75rem/);
  });

  it("regression_center_leads_add_lead_opens_modal", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.queryByRole("button", { name: /Filter/i })).toBeNull();
    expect(screen.queryByText("Add student lead manually")).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: /\+ Add Lead/i }));
    expect(await screen.findByText("Add student lead manually")).toBeDefined();
  });

  it("regression_center_leads_import_csv_opens_dialog", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Import CSV" }));
    expect(screen.getByText("Import student leads dialog")).toBeDefined();
  });

  it("regression_center_leads_list_uses_application_cards", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterLeadsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Meera Reddy")).toBeDefined();
    expect(screen.queryByText("Student Interest")).toBeNull();
    expect(screen.queryByText("Last Contacted")).toBeNull();
    fireEvent.click(screen.getByText("Meera Reddy"));
    expect(await screen.findByRole("link", { name: "Call Meera Reddy" })).toBeDefined();
  });
});
