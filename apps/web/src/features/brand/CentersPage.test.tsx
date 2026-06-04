import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
            order: () => Promise.resolve({ data: [{ id: "c1", slug: "koramangala", name: "Koramangala", status: "active", city: "Bengaluru", address_line1: null, region: null, country: "IN" }], error: null }),
          }),
        }),
      }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
}));

describe("CentersPage", () => {
  it("regression_no_direct_center_create_links_to_franchise_applications", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <CentersPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Franchise Centers")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add center" })).toBeDefined();
    expect(screen.queryByText("Go to franchise applications")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add center" }));
    expect(screen.getByText("Go to franchise applications")).toBeDefined();
    expect(await screen.findByRole("link", { name: "View" })).toBeDefined();
    expect(screen.queryByText("Create center")).toBeNull();
  });
});
