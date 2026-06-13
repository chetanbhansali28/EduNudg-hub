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
      region: null,
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
      region: null,
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

vi.mock("@/lib/centerCurriculumApi", () => ({
  fetchBrandPublishedCurriculumVersions: vi.fn().mockResolvedValue([]),
  fetchCenterAuthorizedCurriculumVersionIds: vi.fn().mockResolvedValue([]),
  groupCurriculumVersionsByProgram: vi.fn().mockReturnValue([]),
  syncCenterCurriculumEnablement: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/center/settings/CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div>Photo upload</div>,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
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

  it("regression_no_direct_center_create_links_to_franchise_applications", async () => {
    renderPage();
    expect(screen.getByText("Franchise Centers")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add center" }));
    expect(screen.getByText("Go to franchise applications")).toBeDefined();
    expect(screen.queryByText("Create center")).toBeNull();
  });

  it("regression_centers_no_delete", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    });
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("regression_master_detail_selects_franchise", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Abacus Koramangala"));
    expect(await screen.findByText("Franchise detail")).toBeDefined();
    expect(screen.getByText(/Slug: koramangala \(read-only\)/)).toBeDefined();
  });

  it("regression_search_by_phone", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: /All/i }));
    await waitFor(() => {
      expect(screen.getByText("Jayanagar")).toBeDefined();
    });
    fireEvent.change(screen.getByPlaceholderText("Name or phone…"), {
      target: { value: "90000" },
    });
    await waitFor(() => {
      expect(screen.getByText("Jayanagar")).toBeDefined();
      expect(screen.queryByText("Abacus Koramangala")).toBeNull();
    });
  });
});
