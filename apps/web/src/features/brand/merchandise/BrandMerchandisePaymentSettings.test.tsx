import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandMerchandisePaymentSettings } from "./BrandMerchandisePaymentSettings";

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: "settings-1", settings: {} }, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabaseResult", () => ({
  supabaseMaybe: (data: unknown) => data,
}));

vi.mock("@/lib/merchandiseSettingsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/merchandiseSettingsApi")>();
  return {
    ...actual,
    fetchMerchandiseBrandSettings: vi.fn().mockResolvedValue(actual.DEFAULT_MERCHANDISE_SETTINGS),
    saveMerchandiseBrandSettings: vi.fn().mockResolvedValue(undefined),
  };
});

describe("BrandMerchandisePaymentSettings", () => {
  it("regression_merchandise_payment_tab_uses_catalog_pipeline_workspace", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <BrandMerchandisePaymentSettings brandId="brand-1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Payment mode" })).toBeDefined();
    expect(screen.getByLabelText("Payment mode")).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(document.querySelectorAll(".ed-franchise-app-list-item")).toHaveLength(4);
    expect(document.querySelector(".ed-franchise-app-list-item--selected")).toBeTruthy();

    fireEvent.click(document.querySelectorAll(".ed-franchise-app-list-item")[1]!);
    expect(await screen.findByLabelText("Razorpay key ID")).toBeDefined();
  });
});
