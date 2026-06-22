import { describe, expect, it } from "vitest";
import {
  brandOnboardingMeta,
  brandOnboardingStatus,
  countTrendLabel,
  platformDashboardGreeting,
} from "./platformDashboardHelpers";

describe("platformDashboardHelpers", () => {
  it("builds time-based greeting", () => {
    expect(platformDashboardGreeting("Platform", 14)).toBe("Good afternoon, Platform 👋");
    expect(platformDashboardGreeting("", 9)).toBe("Good morning, Platform 👋");
  });

  it("maps brand onboarding status labels", () => {
    expect(brandOnboardingStatus("active")).toEqual({ tone: "completed", label: "Completed" });
    expect(brandOnboardingStatus("draft")).toEqual({ tone: "setup", label: "Setup Phase" });
  });

  it("formats onboarding meta relative to status", () => {
    const now = new Date("2026-06-22T12:00:00Z").getTime();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    expect(brandOnboardingMeta("active", twoHoursAgo, now)).toMatch(/^Onboarded:/);
    expect(brandOnboardingMeta("draft", twoHoursAgo, now)).toMatch(/^Started:/);
  });

  it("regression_countTrendLabel_formats_signed_delta", () => {
    expect(countTrendLabel(5, 3)).toBe("+2");
    expect(countTrendLabel(3, 5)).toBe("-2");
    expect(countTrendLabel(4, 4)).toBeNull();
  });
});
