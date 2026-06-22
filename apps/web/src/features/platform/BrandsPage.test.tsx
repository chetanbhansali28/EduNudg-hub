import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { BrandsPage } from "./BrandsPage";

const { fetchPlatformBrandsHome } = vi.hoisted(() => ({
  fetchPlatformBrandsHome: vi.fn(),
}));

vi.mock("@/lib/platformBrandsHomeApi", () => ({
  fetchPlatformBrandsHome,
}));

vi.mock("@/lib/platformBrandSignupApi", () => ({
  listPendingPlatformSignups: vi.fn(async () => []),
  approvePlatformBrandSignup: vi.fn(),
  rejectPlatformBrandSignup: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { url: "https://auth.example/magic" }, error: null }) },
  }),
}));

vi.mock("@/lib/manualLeadsApi", () => ({
  createPlatformBrandSignupStaff: vi.fn(async () => ({ error: null })),
}));

function renderBrands() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={["/admin/brands"]}>
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <Routes>
            <Route path="/admin/brands" element={<BrandsPage />} />
            <Route path="/admin/brands/:brandSlug" element={<div>Brand detail page</div>} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("BrandsPage", () => {
  beforeEach(() => {
    fetchPlatformBrandsHome.mockReset();
    fetchPlatformBrandsHome.mockResolvedValue({
      brands: [{ id: "b1", slug: "demo", name: "Demo Brand", status: "active", logo_url: null }],
      pendingSignups: 0,
      totalStudents: 12400,
      monthlyGrowthPercent: 18,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("renders brand list and add brand controls", async () => {
    renderBrands();
    expect((await screen.findAllByText("Demo Brand")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "+ Add brand" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Add brand" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "+ Add brand" }));
    expect(screen.getByRole("button", { name: "Create signup request" })).toBeDefined();
  });

  it("regression_brands_page_no_signup_tabs", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(screen.queryByRole("button", { name: "Signup requests" })).toBeNull();
    expect(screen.queryByRole("button", { name: "All brands" })).toBeNull();
  });

  it("regression_brands_page_shows_edit_and_delete_actions", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(screen.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Delete" }).length).toBeGreaterThan(0);
  });

  it("regression_edit_navigates_to_brand_detail_page", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(screen.getByText("Brand detail page")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("regression_brand_name_links_to_detail_page", async () => {
    renderBrands();
    const links = await screen.findAllByRole("link", { name: "Demo Brand" });
    expect(links.some((link) => link.getAttribute("href") === "/admin/brands/demo")).toBe(true);
  });

  it("shows brand backend button", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(screen.getAllByRole("button", { name: "Brand backend" }).length).toBeGreaterThan(0);
  });

  it("regression_brands_list_omits_website_theme_controls", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(screen.queryByLabelText("Website theme")).toBeNull();
  });

  it("regression_brands_page_renders_directory_workspace", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(document.querySelector(".ed-directory")).toBeTruthy();
    expect(screen.getByText("Manage and monitor all active brand ecosystems.")).toBeDefined();
    expect(screen.getAllByText("Pending review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Total Students").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Monthly Growth").length).toBeGreaterThan(0);
    expect(screen.queryByText("Signup requests")).toBeNull();
  });

  it("regression_add_brand_scrolls_to_manual_signup_section", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    renderBrands();
    await screen.findAllByText("Demo Brand");
    fireEvent.click(screen.getByRole("button", { name: "+ Add brand" }));

    expect(await screen.findByRole("button", { name: "Create signup request" })).toBeDefined();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("regression_mobile_toolbar_omits_search_and_add_link", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(document.querySelector(".ed-directory-mobile-toolbar__search")).toBeNull();
    expect(document.querySelector(".ed-directory-mobile-toolbar__link")).toBeNull();
    expect(screen.getByRole("button", { name: "Add brand", hidden: true })).toBeDefined();
  });

  it("regression_brands_page_omits_list_controls_until_eleven_brands", async () => {
    renderBrands();
    await screen.findAllByText("Demo Brand");
    expect(screen.queryByRole("button", { name: /Sort:/ })).toBeNull();
    expect(screen.queryByPlaceholderText("Search brands…")).toBeNull();
    expect(document.querySelector(".ed-directory-stat-grid--row")).toBeTruthy();
  });

  it("regression_brands_page_shows_list_controls_for_large_lists", async () => {
    fetchPlatformBrandsHome.mockResolvedValue({
      brands: Array.from({ length: 11 }, (_, index) => ({
        id: `b${index}`,
        slug: `brand-${index}`,
        name: `Brand ${index}`,
        status: "active",
        logo_url: null,
      })),
      pendingSignups: 2,
      totalStudents: 12400,
      monthlyGrowthPercent: 18,
    });

    renderBrands();
    await screen.findAllByPlaceholderText("Search brands…");
    expect(screen.getAllByText("1–10 of 11").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Sort: Alphabetical/ })).toBeNull();
  });
});
