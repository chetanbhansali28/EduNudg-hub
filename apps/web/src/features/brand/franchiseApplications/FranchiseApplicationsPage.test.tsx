import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FranchiseApplicationsPage } from "./FranchiseApplicationsPage";

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
          order: () => Promise.resolve({ data: [], error: null }),
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
});
