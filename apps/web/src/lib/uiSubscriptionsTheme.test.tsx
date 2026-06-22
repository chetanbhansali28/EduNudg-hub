import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  SubscriptionBillingToggle,
  SubscriptionPageHeader,
  SubscriptionPlanCard,
  SubscriptionShell,
  SubscriptionStatusBadge,
  ThemeProvider,
} from "@edunudg/ui";

describe("Subscription UI theme", () => {
  it("renders page header", () => {
    render(
      <ThemeProvider>
        <SubscriptionPageHeader
          title="Subscriptions & Billing"
          subtitle="Prices are in Indian Rupees (₹)."
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Subscriptions & Billing")).toBeDefined();
    expect(screen.getByText("Prices are in Indian Rupees (₹).")).toBeDefined();
  });

  it("renders featured plan card with edit action", () => {
    const onAction = vi.fn();
    render(
      <ThemeProvider>
        <SubscriptionShell>
          <SubscriptionPlanCard
            tierLabel="GROWTH"
            priceLabel="₹999"
            intervalLabel="/month"
            features={[{ key: "centers", label: "15 Franchise centers", included: true }]}
            tone="growth"
            featured
            onAction={onAction}
          />
        </SubscriptionShell>
      </ThemeProvider>
    );

    expect(screen.getByText("GROWTH")).toBeDefined();
    expect(document.querySelector(".ed-sub-plan-card--featured")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit Plan" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(document.querySelector(".ed-sub")).toBeTruthy();
  });

  it("renders billing toggle and status badge", () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider>
        <SubscriptionBillingToggle value="monthly" onChange={onChange} />
        <SubscriptionStatusBadge label="ACTIVE" tone="active" />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /yearly/i }));
    expect(onChange).toHaveBeenCalledWith("yearly");
    expect(screen.getByText("ACTIVE")).toBeDefined();
  });
});
