import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FranchiseApplicationsPage } from "./FranchiseApplicationsPage";

const sampleInquiry = {
  id: "inq-1",
  full_name: "Priya Sharma",
  email: "priya@example.com",
  phone_e164: "+919876543210",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  address_line: "42 FC Road",
  proposed_franchise_name: "Abacus Pune West",
  prior_experience: "Ran a tutoring center for 3 years.",
  message: "Looking to open in Q3.",
  status: "new",
  rejected_reason: null,
  converted_center_id: null,
  created_at: "2026-06-01T10:00:00Z",
  updated_at: "2026-06-01T10:00:00Z",
};

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

vi.mock("@/features/shared/manualLeads/ManualFranchiseInquiryCard", () => ({
  ManualFranchiseInquiryCard: () => <div>Manual franchise card</div>,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [sampleInquiry], error: null }),
        }),
      }),
    }),
  }),
}));

describe("FranchiseApplicationsPage", () => {
  it("regression_single_applications_list_with_filter", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <FranchiseApplicationsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Applications")).toBeDefined();
    expect(screen.getByLabelText("Show")).toBeDefined();
    expect(screen.queryByText(/^Pending \(/)).toBeNull();
    expect(screen.getAllByText("Applications")).toHaveLength(1);
  });

  it("regression_franchise_name_opens_full_application_detail", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <FranchiseApplicationsPage />
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Abacus Pune West" }));

    expect(screen.getByText("Application detail")).toBeDefined();
    expect(screen.getByText("42 FC Road")).toBeDefined();
    expect(screen.getByText("Ran a tutoring center for 3 years.")).toBeDefined();
    expect(screen.getByText("Looking to open in Q3.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Approve & create center" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDefined();
  });
});
