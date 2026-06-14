import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandsPage } from "./BrandsPage";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { url: "https://auth.example/magic" }, error: null }) },
  }),
}));

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return c;
}

function renderBrands() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={["/admin/brands"]}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/admin/brands" element={<BrandsPage />} />
          <Route path="/admin/brands/:brandSlug" element={<div>Brand detail page</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("BrandsPage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: [{ id: "b1", slug: "demo", name: "Demo Brand", status: "active", logo_url: null }],
          error: null,
        });
      }
      if (table === "platform_brand_signups") {
        return chain({ data: [], error: null });
      }
      return chain({ data: [], error: null });
    });
  });

  it("renders brand list and manual signup form", async () => {
    renderBrands();
    expect(await screen.findByText("Demo Brand")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add brand" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Create signup request" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Create brand" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add brand" }));
    expect(screen.getByRole("button", { name: "Create signup request" })).toBeDefined();
  });

  it("regression_brands_page_no_signup_tabs", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    expect(screen.queryByRole("button", { name: "Signup requests" })).toBeNull();
    expect(screen.queryByRole("button", { name: "All brands" })).toBeNull();
  });

  it("regression_brands_page_shows_edit_and_delete_actions", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("regression_edit_navigates_to_brand_detail_page", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Brand detail page")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("regression_brand_name_links_to_detail_page", async () => {
    renderBrands();
    const link = await screen.findByRole("link", { name: "Demo Brand" });
    expect(link.getAttribute("href")).toBe("/admin/brands/demo");
  });

  it("shows brand backend button", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    expect(screen.getByRole("button", { name: "Brand backend" })).toBeDefined();
  });

  it("regression_brands_list_omits_website_theme_controls", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    expect(screen.queryByLabelText("Website theme")).toBeNull();
  });
});
