import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CentersPage } from "./CentersPage";

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacusworld", isLoading: false, missingBrand: false }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
}));

describe("CentersPage", () => {
  it("regression_renders_crud_sections", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CentersPage />
      </QueryClientProvider>
    );
    expect(screen.getByText("Franchise Centers")).toBeDefined();
    expect(screen.getByText("Add center")).toBeDefined();
    expect(screen.getByText("Create center")).toBeDefined();
  });
});
