import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMarketingThemesPanel } from "./BrandMarketingThemesPanel";

const fromMock = vi.fn();

vi.mock("@/lib/brandLandingApi", () => ({
  updateBrandMarketingTheme: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock }),
}));

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return c;
}

describe("BrandMarketingThemesPanel", () => {
  beforeEach(() => {
    fromMock.mockImplementation(() =>
      chain({
        data: [
          {
            id: "b1",
            slug: "digitley-pune",
            name: "Digitley",
            marketing_theme: "novu",
          },
          {
            id: "b2",
            slug: "smart-brain-abacus",
            name: "Smart Brain Abacus",
            marketing_theme: "spark-academy",
          },
        ],
        error: null,
      })
    );
  });

  it("regression_renders_responsive_brand_theme_cards", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMarketingThemesPanel />
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Brand marketing themes" })).toBeDefined();
    expect(await screen.findByText("Digitley")).toBeDefined();
    expect(document.querySelector(".ed-brand-marketing-themes__list")).toBeDefined();
    expect(screen.getByText("digitley-pune")).toBeDefined();
    expect(screen.getByText("Smart Brain Abacus")).toBeDefined();
    expect(screen.getAllByLabelText("Website theme")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Saved" })).toHaveLength(2);
  });

  it("shows unsaved state when theme draft changes", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMarketingThemesPanel />
      </QueryClientProvider>
    );

    const selects = await screen.findAllByLabelText("Website theme");
    fireEvent.change(selects[0]!, { target: { value: "spark-academy" } });

    expect(screen.getByText("Unsaved changes")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save theme" })).toBeDefined();
  });
});
