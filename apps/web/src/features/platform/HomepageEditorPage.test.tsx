import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomepageEditorPage } from "./HomepageEditorPage";

const fromMock = vi.fn();

vi.mock("@/features/marketing/HomepageEditorForm", () => ({
  HomepageEditorForm: () => <div>Homepage form stub</div>,
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageEditorBundle: vi.fn().mockResolvedValue({
    config: { meta: { siteName: "EduNudg" } },
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  }),
  saveHomepageConfig: vi.fn(),
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

describe("HomepageEditorPage", () => {
  beforeEach(() => {
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: [
            {
              id: "b1",
              slug: "smart-brain-abacus",
              name: "Smart Brain Abacus",
              marketing_theme: "novu",
            },
          ],
          error: null,
        });
      }
      return chain({ data: [], error: null });
    });
  });

  it("regression_includes_brand_marketing_themes_section", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <HomepageEditorPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Homepage Configuration")).toBeDefined();
    expect(screen.getByText("Brand marketing themes")).toBeDefined();
    expect(screen.getByText("Smart Brain Abacus")).toBeDefined();
  });
});
