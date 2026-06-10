import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCenterDetailPage } from "./BrandCenterDetailPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({
    brandId: "brand-1",
    brandSlug: "abacus",
    isLoading: false,
    missingBrand: false,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table === "franchise_centers") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: "c1",
                        slug: "koramangala",
                        name: "Koramangala",
                        display_name: "Koramangala Center",
                        status: "active",
                        city: "Bengaluru",
                        pincode: "560034",
                        address_line1: "12 Main Road",
                        contact_phone: null,
                        short_description: "Flagship center",
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "leads") {
        const chain = {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return { eq: () => ({ in: () => Promise.resolve({ count: 2, error: null }) }) };
            }
            return chain;
          },
          eq: () => chain,
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          in: () => Promise.resolve({ count: 2, error: null }),
        };
        return chain;
      }
      if (table === "student_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [{ student_id: "s1" }], error: null, count: 1 }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
      };
    },
  }),
}));

describe("BrandCenterDetailPage", () => {
  it("regression_read_only_center_360_view", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={["/app/centers/koramangala"]}>
        <QueryClientProvider client={qc}>
          <Routes>
            <Route path="/app/centers/:centerSlug" element={<BrandCenterDetailPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("Koramangala Center")).toBeDefined();
    expect(screen.getByText(/Read-only 360° view/)).toBeDefined();
    expect(document.querySelector(".ed-detail-page")).toBeTruthy();
    expect(document.querySelector(".ed-detail-page__toolbar")).toBeTruthy();
    expect(screen.getByText("Center profile")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });
});
