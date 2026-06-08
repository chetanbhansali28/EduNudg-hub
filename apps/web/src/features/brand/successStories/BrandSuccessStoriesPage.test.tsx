import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandSuccessStoriesPage } from "./BrandSuccessStoriesPage";

const fromMock = vi.fn();

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacusworld", isLoading: false, missingBrand: false }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock }),
}));

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => c),
    delete: vi.fn(() => Promise.resolve({ error: null })),
  };
  return c;
}

describe("BrandSuccessStoriesPage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation(() => chain({ data: [], error: null }));
  });

  it("regression_renders_without_useAddFormCloser_reference_error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <BrandSuccessStoriesPage />
      </QueryClientProvider>
    );

    expect(await screen.findByRole("button", { name: "Add success story" })).toBeDefined();
    expect(screen.getAllByRole("heading", { name: "Success stories" }).length).toBeGreaterThan(0);
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("useAddFormCloser is not defined")
    );
    consoleError.mockRestore();
  });
});
