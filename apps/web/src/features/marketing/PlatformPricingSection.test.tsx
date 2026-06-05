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

  it("regression_all_pricing_cards_include_frame_class", async () => {
    fetchPublicSubscriptionPlans.mockResolvedValue([
      {
        code: "starter",
        name: "Starter",
        price_cents: 0,
        currency: "INR",
        billing_interval: "month",
        features: STARTER_PLAN_FEATURES,
        is_default: false,
      },
      {
        code: "growth",
        name: "Growth",
        price_cents: 99900,
        currency: "INR",
        billing_interval: "month",
        features: STARTER_PLAN_FEATURES,
        is_default: false,
      },
      {
        code: "enterprise",
        name: "Enterprise",
        price_cents: 799900,
        currency: "INR",
        billing_interval: "month",
        features: STARTER_PLAN_FEATURES,
        is_default: false,
      },
    ]);
    renderPricing();
    await screen.findByText("Enterprise");
    const cards = document.querySelectorAll(".novu-pricing-card");
    expect(cards.length).toBe(3);
    expect(cards[2]?.className).toContain("novu-pricing-card");
    expect(cards[2]?.className).not.toContain("novu-pricing-card--highlight");
  });
});
