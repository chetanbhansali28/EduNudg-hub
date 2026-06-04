import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentsPage } from "./StudentsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacus",
    centerSlug: "koramangala",
    hostname: "koramangala.abacus.localhost",
  }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}));

describe("StudentsPage", () => {
  it("regression_no_direct_register_links_to_leads", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <StudentsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "Add students" })).toBeDefined();
    expect(screen.queryByText("Go to leads")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add students" }));
    expect(screen.getByText("Go to leads")).toBeDefined();
    expect(screen.queryByText("Register + enroll")).toBeNull();
  });
});
