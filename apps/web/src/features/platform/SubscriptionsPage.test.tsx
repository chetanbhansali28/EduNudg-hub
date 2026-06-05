import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionsPage } from "./SubscriptionsPage";

import { STARTER_PLAN_FEATURES } from "@/lib/subscriptionPlanFeatures";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    delete: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return c;
}

function renderSubs() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SubscriptionsPage />
    </QueryClientProvider>
  );
}

describe("SubscriptionsPage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === "subscription_plans") {
        return chain({
          data: [
            {
              id: "p1",
              code: "starter",
              name: "Starter",
              price_cents: 999900,
              currency: "INR",
              billing_interval: "month",
              is_active: true,
              is_default: true,
              features: STARTER_PLAN_FEATURES,
            },
          ],
          error: null,
        });
      }
      if (table === "brand_subscriptions") {
        return chain({ data: [], error: null });
      }
      if (table === "brands") {
        return chain({ data: [{ id: "b1", name: "Demo" }], error: null });
      }
      return chain({ data: [], error: null });
    });
  });

  it("renders plans with CRUD controls", async () => {
    renderSubs();
    expect(await screen.findByRole("button", { name: "Create plan" })).toBeDefined();
    expect(screen.getByText("Plans")).toBeDefined();
    await screen.findByRole("button", { name: "Edit" });
    expect(screen.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/₹9,999\.00/)).toBeDefined();
    expect(document.querySelector(".ed-plan-cards")).toBeTruthy();
    expect(screen.getAllByText(/default plan/i).length).toBeGreaterThan(0);
  });

  it("regression_subscriptions_page_has_assign_subscription_form", async () => {
    renderSubs();
    expect(await screen.findByRole("button", { name: "Assign subscription" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Assign plan" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Assign subscription" }));
    expect(screen.getByRole("button", { name: "Assign plan" })).toBeDefined();
  });
});
