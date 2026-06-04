import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCampaignsPage } from "./BrandCampaignsPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/lib/campaignsApi", () => ({
  listBrandCampaigns: vi.fn().mockResolvedValue([]),
  upsertBrandCampaign: vi.fn(),
  deleteBrandCampaign: vi.fn(),
}));

describe("BrandCampaignsPage", () => {
  it("regression_campaigns_page_uses_rpc_backed_form", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandCampaignsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByRole("button", { name: "Add campaign" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add campaign" }));
    expect(screen.getByText("Active (visible to centers)")).toBeDefined();
  });
});
