import { describe, expect, it } from "vitest";
import {
  formatSubscriptionPrice,
  resolveSubscriptionPlan,
  subscriptionStatusBadge,
} from "./brandBillingHelpers";

describe("brandBillingHelpers", () => {
  it("maps subscription status badges", () => {
    expect(subscriptionStatusBadge("active")).toEqual({ label: "ACTIVE", tone: "active" });
    expect(subscriptionStatusBadge("past_due")).toEqual({ label: "PAST DUE", tone: "warning" });
  });

  it("formats subscription price with interval", () => {
    expect(formatSubscriptionPrice(0, "INR")).toBe("₹0.00/month");
  });

  it("resolves nested subscription plan rows", () => {
    expect(resolveSubscriptionPlan({ name: "Starter", price_cents: 0, currency: "INR" })?.name).toBe(
      "Starter"
    );
    expect(resolveSubscriptionPlan([{ name: "Pro", price_cents: 100, currency: "INR" }])?.name).toBe(
      "Pro"
    );
  });
});
