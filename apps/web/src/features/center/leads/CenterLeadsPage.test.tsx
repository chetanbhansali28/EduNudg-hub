import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  ManualStudentLeadCard: () => <div>Manual lead</div>,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

describe("CenterLeadsPage", () => {
  it("regression_center_leads_pipeline_with_filter_tabs", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterLeadsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Lead pipeline")).toBeDefined();
    expect(screen.getByRole("tablist", { name: "Lead filter" })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by name, phone, or email/i)).toBeDefined();
    expect(screen.queryByLabelText("Show")).toBeNull();
  });
});
