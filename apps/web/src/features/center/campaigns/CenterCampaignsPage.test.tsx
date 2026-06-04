import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterCampaignsPage } from "./CenterCampaignsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", centerId: "center-1" }),
}));

vi.mock("@/lib/campaignsApi", () => ({
  listActiveBrandCampaigns: vi.fn().mockResolvedValue([
    { id: "c1", name: "Summer drive", description: "Enroll now", goal_type: "enrollment", starts_at: null, ends_at: null },
  ]),
}));

describe("CenterCampaignsPage", () => {
  it("regression_center_sees_active_brand_campaigns", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterCampaignsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Summer drive")).toBeDefined();
    expect(screen.getByText("Brand campaigns")).toBeDefined();
  });
});
