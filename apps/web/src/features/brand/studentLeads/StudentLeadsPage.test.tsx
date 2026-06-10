import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentLeadsPage } from "./StudentLeadsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", isLoading: false, missingBrand: false }),
}));

vi.mock("@/features/shared/manualLeads/ManualStudentLeadCard", () => ({
  ManualStudentLeadCard: () => <div>Manual student lead</div>,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        is: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
    rpc: () => Promise.resolve({ data: { exact: [], near: [] }, error: null }),
  }),
}));

describe("StudentLeadsPage", () => {
  it("regression_pipeline_list_with_filter_tabs", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <StudentLeadsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("Lead pipeline")).toBeDefined();
    expect(screen.getByRole("tablist", { name: "Lead filter" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Needs attention (0)" })).toBeDefined();
    expect(screen.queryByLabelText("Show")).toBeNull();
  });
});
