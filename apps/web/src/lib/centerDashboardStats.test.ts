import { describe, expect, it } from "vitest";
import { computeFeeCollectionRate } from "@/lib/centerDashboardStats";

describe("centerDashboardStats", () => {
  it("computeFeeCollectionRate sums paid vs billable", () => {
    const { rate, overdueCents } = computeFeeCollectionRate([
      { amount_cents: 10000, status: "paid" },
      { amount_cents: 10000, status: "sent" },
      { amount_cents: 5000, status: "overdue" },
    ]);
    expect(rate).toBe(40);
    expect(overdueCents).toBe(5000);
  });
});
