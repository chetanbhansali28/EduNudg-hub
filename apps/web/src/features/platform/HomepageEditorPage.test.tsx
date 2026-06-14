import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomepageEditorPage } from "./HomepageEditorPage";

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

describe("HomepageEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("regression_omits_brand_marketing_themes_section", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <HomepageEditorPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Homepage Configuration")).toBeDefined();
    expect(screen.queryByText("Brand marketing themes")).toBeNull();
    expect(screen.queryByLabelText("Website theme")).toBeNull();
  });
});
