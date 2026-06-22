import { describe, expect, it } from "vitest";
import {
  brandInitials,
  filterBrandSubscriptions,
  formatBillingDate,
  formatPlanPriceLabel,
  isAlternatingFeaturedPlanCard,
  planCardFeatures,
  planToneFromCode,
  resolveBrandSubscriptionsList,
  shouldShowBrandSubscriptionListControls,
  subscriptionStatusLabel,
  subscriptionStatusTone,
} from "./subscriptionPlanDisplay";
import { STARTER_PLAN_FEATURES } from "./subscriptionPlanFeatures";

describe("subscriptionPlanDisplay", () => {
  it("maps plan codes to tones", () => {
    expect(planToneFromCode("starter")).toBe("starter");
    expect(planToneFromCode("growth")).toBe("growth");
    expect(planToneFromCode("enterprise")).toBe("enterprise");
  });

  it("formats monthly and yearly prices", () => {
    const monthly = formatPlanPriceLabel(99900, "INR", "monthly");
    expect(monthly.priceLabel).toBe("₹999.00");
    expect(monthly.intervalLabel).toBe("/month");

    const yearly = formatPlanPriceLabel(99900, "INR", "yearly");
    expect(yearly.intervalLabel).toBe("/year");
    expect(yearly.priceLabel).toContain("₹");
  });

  it("formats subscription status labels and tones", () => {
    expect(subscriptionStatusLabel("active")).toBe("ACTIVE");
    expect(subscriptionStatusTone("active")).toBe("active");
    expect(subscriptionStatusLabel("cancelled")).toBe("EXPIRED");
    expect(subscriptionStatusTone("cancelled")).toBe("expired");
  });

  it("formats billing dates and brand initials", () => {
    expect(formatBillingDate("2023-10-12T00:00:00.000Z")).toMatch(/Oct/);
    expect(formatBillingDate(null)).toBe("—");
    expect(brandInitials("Smart Brain Abacus")).toBe("SB");
  });

  it("filters brand subscriptions by brand or plan name", () => {
    const rows = [
      { brands: { name: "Alpha" }, subscription_plans: { name: "Growth" } },
      { brands: { name: "Beta" }, subscription_plans: { name: "Starter" } },
    ];
    expect(filterBrandSubscriptions(rows, "alpha")).toHaveLength(1);
    expect(filterBrandSubscriptions(rows, "starter")).toHaveLength(1);
    expect(filterBrandSubscriptions(rows, "")).toHaveLength(2);
  });

  it("builds plan card features from limits", () => {
    const features = planCardFeatures(STARTER_PLAN_FEATURES);
    expect(features.some((feature) => feature.label.includes("Franchise centers"))).toBe(true);
  });

  it("highlights every second plan card", () => {
    expect(isAlternatingFeaturedPlanCard(0)).toBe(false);
    expect(isAlternatingFeaturedPlanCard(1)).toBe(true);
    expect(isAlternatingFeaturedPlanCard(3)).toBe(true);
  });

  it("shows subscription list controls only when more than ten rows", () => {
    expect(shouldShowBrandSubscriptionListControls(10)).toBe(false);
    expect(shouldShowBrandSubscriptionListControls(11)).toBe(true);
  });

  it("paginates large subscription lists", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      brands: { name: `Brand ${index}` },
      subscription_plans: { name: "Starter" },
      status: "active",
    }));
    const resolved = resolveBrandSubscriptionsList(rows, {
      showControls: true,
      search: "",
      sort: "brand-asc",
      page: 2,
    });
    expect(resolved.items).toHaveLength(2);
    expect(resolved.rangeStart).toBe(11);
  });
});
