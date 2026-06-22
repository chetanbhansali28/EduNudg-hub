import { describe, expect, it } from "vitest";
import {
  brandInitials,
  brandMarkTone,
  computeRevenueSummary,
  enrollmentGoalPercent,
  formatInvoiceDate,
  formatInvoiceId,
  invoiceStatusLabel,
  invoiceStatusTone,
  recentInvoices,
  sumEnrollments,
} from "./platformRevenueHelpers";

describe("platformRevenueHelpers", () => {
  it("maps invoice status labels and tones", () => {
    expect(invoiceStatusLabel("paid")).toBe("PAID");
    expect(invoiceStatusTone("paid")).toBe("paid");
    expect(invoiceStatusLabel("overdue")).toBe("OVERDUE");
    expect(invoiceStatusTone("sent")).toBe("pending");
  });

  it("formats invoice dates and ids", () => {
    expect(formatInvoiceDate("2023-10-24T00:00:00.000Z")).toMatch(/Oct/);
    expect(formatInvoiceDate(null)).toBe("—");
    expect(formatInvoiceId("abc-123-def", "2023-10-24T00:00:00.000Z")).toMatch(/^INV-2023-/);
  });

  it("computes revenue summary from invoices and metrics", () => {
    const summary = computeRevenueSummary({
      invoices: [
        {
          id: "i1",
          brand_id: "b1",
          amount_cents: 1240000,
          currency: "INR",
          status: "paid",
        },
        {
          id: "i2",
          brand_id: "b2",
          amount_cents: 890000,
          currency: "INR",
          status: "overdue",
        },
        {
          id: "i3",
          brand_id: "b3",
          amount_cents: 1500000,
          currency: "INR",
          status: "sent",
        },
      ],
      metrics: [{ id: "m1", brand_id: "b1", metric_date: "2026-06-01", enrollments_count: 24, revenue_cents: 0, active_centers: 2 }],
      activeSubscriptions: 142,
      brandCount: 18,
    });

    expect(summary.totalRevenueLabel).toContain("₹");
    expect(summary.activeSubscriptions).toBe(142);
    expect(summary.pendingInvoices).toBe(1);
    expect(summary.overdueInvoices).toBe(1);
  });

  it("derives brand initials, tones, and enrollment goal", () => {
    expect(brandInitials("EduNest Learning")).toBe("EL");
    expect(["blue", "purple", "pink"]).toContain(brandMarkTone("BrightStep Intl"));
    expect(sumEnrollments([
      { id: "m1", brand_id: "b1", metric_date: "2026-06-01", enrollments_count: 24, revenue_cents: 0, active_centers: 1 },
      { id: "m2", brand_id: "b2", metric_date: "2026-06-01", enrollments_count: 8, revenue_cents: 0, active_centers: 1 },
    ])).toBe(32);
    expect(enrollmentGoalPercent([
      { id: "m1", brand_id: "b1", metric_date: "2026-06-01", enrollments_count: 720, revenue_cents: 0, active_centers: 1 },
    ], 1000)).toBe(72);
  });

  it("returns recent invoices in order", () => {
    const rows = recentInvoices(
      [
        { id: "1", brand_id: "b1", amount_cents: 100, currency: "INR", status: "paid" },
        { id: "2", brand_id: "b2", amount_cents: 200, currency: "INR", status: "paid" },
        { id: "3", brand_id: "b3", amount_cents: 300, currency: "INR", status: "paid" },
      ],
      2
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe("1");
  });
});
