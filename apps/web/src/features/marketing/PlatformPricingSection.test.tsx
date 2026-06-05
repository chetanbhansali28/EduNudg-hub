import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { PlatformPricingSection } from "./PlatformPricingSection";
import { STARTER_PLAN_FEATURES } from "@/lib/subscriptionPlanFeatures";

const fetchPublicSubscriptionPlans = vi.fn();

vi.mock("@/lib/subscriptionPlansApi", () => ({
  fetchPublicSubscriptionPlans: () => fetchPublicSubscriptionPlans(),
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegration: (key: string) => key === "public_pricing",
}));

function renderPricing() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PlatformPricingSection ctaHref="/login" ctaLabel="Get started" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("PlatformPricingSection", () => {
  beforeEach(() => {
    fetchPublicSubscriptionPlans.mockReset();
    fetchPublicSubscriptionPlans.mockResolvedValue([
      {
        code: "starter",
        name: "Starter",
        price_cents: 999900,
        currency: "INR",
        billing_interval: "month",
        features: STARTER_PLAN_FEATURES,
        is_default: true,
      },
    ]);
  });

  it("regression_renders_inr_pricing_with_get_started_cta", async () => {
    renderPricing();
    expect(await screen.findByRole("heading", { name: /Simple pricing/i })).toBeDefined();
    expect(screen.getByText(/₹9,999\.00/)).toBeDefined();
    expect(screen.getByRole("link", { name: /Get started/i }).getAttribute("href")).toBe("/login");
    expect(document.querySelector(".novu-pricing-card__cta")?.className).toContain("novu-marketing-cta--on-light");
    expect(screen.queryByText("Default for new brands")).toBeNull();
  });
});
