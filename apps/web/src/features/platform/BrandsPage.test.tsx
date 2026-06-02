import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandsPage } from "./BrandsPage";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
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
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <BrandsPage />
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
      return chain({ data: [], error: null });
    });
  });

  it("renders brand list and create form", async () => {
    renderBrands();
    expect(await screen.findByText("Demo Brand")).toBeDefined();
    expect(screen.getByLabelText("Slug")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create brand" })).toBeDefined();
  });

  it("regression_brands_page_shows_edit_and_delete_actions", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("enters inline edit mode", async () => {
    renderBrands();
    await screen.findByText("Demo Brand");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    });
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
});
