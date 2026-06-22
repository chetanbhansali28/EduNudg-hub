import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BrandBillingPage } from "./BrandBillingPage";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({ data: { brandName: "EduFranchise" } }),
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegration: () => true,
}));

vi.mock("@/lib/brandBillingApi", () => ({
  fetchBrandBillingSummary: vi.fn().mockResolvedValue({
    subscription: {
      id: "sub-1",
      status: "active",
      plan_id: "plan-1",
      subscription_plans: { name: "Starter", price_cents: 0, currency: "INR" },
    },
    invoices: [],
  }),
}));

vi.mock("@/services/payments/brandSubscriptionCheckout", () => ({
  createBrandSubscriptionCheckout: vi.fn(),
}));

describe("BrandBillingPage", () => {
  it("regression_renders_billing_mockup_sections", async () => {
    const billingData = {
      subscription: {
        id: "sub-1",
        status: "active",
        plan_id: "plan-1",
        subscription_plans: { name: "Starter", price_cents: 0, currency: "INR" },
      },
      invoices: [],
    };
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(["brand-billing", "brand-1"], billingData);

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <BrandBillingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { name: "Billing", level: 1 })).toBeDefined();
    expect(screen.getByText("EduFranchise")).toBeDefined();
    expect(screen.getByText(/Manage your franchise subscription/)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Platform subscription", level: 2 })).toBeDefined();
    expect(screen.getAllByText("ACTIVE").length).toBeGreaterThan(0);
    expect(screen.getByText("Starter")).toBeDefined();
    expect(screen.getByText("₹0.00/month")).toBeDefined();
    expect(screen.getByRole("button", { name: "Pay platform subscription" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Invoices", level: 2 })).toBeDefined();
    expect(screen.getByText("No invoices yet.")).toBeDefined();
    expect(screen.getByText("Need more seats?")).toBeDefined();
    expect(screen.getByText("Security Deposit")).toBeDefined();
  });
});
