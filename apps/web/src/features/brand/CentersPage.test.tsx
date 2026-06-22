import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CentersPage } from "./CentersPage";

const { mockCenters } = vi.hoisted(() => ({
  mockCenters: [
    {
      id: "c1",
      slug: "koramangala",
      name: "Koramangala Center",
      display_name: "Abacus Koramangala",
      status: "active" as const,
      city: "Bengaluru",
      region: "KA",
      pincode: "560034",
      contact_phone: "+91 98765 43210",
      address_line1: null,
      short_description: null,
      country: "IN",
      photo_url: null,
      social_links: [],
    },
    {
      id: "c2",
      slug: "jayanagar",
      name: "Jayanagar",
      display_name: null,
      status: "suspended" as const,
      city: "Bengaluru",
      region: "KA",
      pincode: null,
      contact_phone: "+91 90000 11111",
      address_line1: null,
      short_description: null,
      country: "IN",
      photo_url: null,
      social_links: [],
    },
  ],
}));

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({
    brandId: "brand-1",
    brandSlug: "abacusworld",
    isLoading: false,
    missingBrand: false,
  }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/centerCentersApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/centerCentersApi")>();
  return {
    ...actual,
    fetchBrandCenters: vi.fn().mockResolvedValue(mockCenters),
    fetchCenterStats: vi.fn().mockResolvedValue({
      openLeads: 2,
      staleLeads: 0,
      students: 5,
      activeEnrollments: 5,
    }),
    updateFranchiseCenter: vi.fn().mockResolvedValue(undefined),
    setFranchiseCenterStatus: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () =>
              Promise.resolve({
                data: table === "programs" ? [{ id: "p1", name: "Abacus", age_label: "L1-L8", description: "Core" }] : [],
                error: null,
              }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/centerCurriculumApi", () => ({
  fetchCenterAuthorizedProgramIds: vi.fn().mockResolvedValue([]),
  setCenterCourseAuthorized: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/center/settings/CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div>Photo upload</div>,
}));

function renderPage(initialEntries = ["/app/centers"]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={qc}>
        <CentersPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("CentersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("regression_centers_management_layout", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Franchise Management" })).toBeDefined();
    expect(screen.getByText("Total Centers")).toBeDefined();
    expect(screen.getByText("Directory")).toBeDefined();
    expect(screen.getByRole("link", { name: "Add New" })).toBeDefined();
  });

  it("regression_centers_no_delete", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    });
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("regression_master_detail_selects_center", async () => {
    renderPage(["/app/centers?center=koramangala"]);
    expect(await screen.findByText("Franchise Identity")).toBeDefined();
    expect(screen.getByLabelText("Franchise Name")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDefined();
  });

  it("regression_search_by_phone", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    });
    fireEvent.click(screen.getByRole("button", { name: /Total Centers/i }));
    fireEvent.change(screen.getByPlaceholderText("Search centers…"), {
      target: { value: "90000" },
    });
    await waitFor(() => {
      expect(screen.getByText("Jayanagar")).toBeDefined();
      expect(screen.queryByText("Abacus Koramangala")).toBeNull();
    });
  });
});
