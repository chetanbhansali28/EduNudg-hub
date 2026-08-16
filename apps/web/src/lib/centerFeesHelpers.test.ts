import { describe, expect, it } from "vitest";
import {
  computeInvoiceStatusAfterPayment,
  feesInvoiceCounts,
  filterFeeInvoices,
  invoiceDisplayLabel,
  isInvoicePayable,
} from "./centerFeesHelpers";

describe("centerFeesHelpers", () => {
  it("computeInvoiceStatusAfterPayment marks paid when total meets invoice", () => {
    expect(computeInvoiceStatusAfterPayment(500000, 500000, "sent")).toBe("paid");
    expect(computeInvoiceStatusAfterPayment(500000, 250000, "sent")).toBe("partial");
    expect(computeInvoiceStatusAfterPayment(500000, 0, "overdue")).toBe("overdue");
    expect(computeInvoiceStatusAfterPayment(500000, 0, "cancelled")).toBe("cancelled");
  });

  it("isInvoicePayable excludes paid and cancelled invoices", () => {
    expect(isInvoicePayable("sent")).toBe(true);
    expect(isInvoicePayable("partial")).toBe(true);
    expect(isInvoicePayable("paid")).toBe(false);
    expect(isInvoicePayable("cancelled")).toBe(false);
  });

  it("invoiceDisplayLabel falls back to short id", () => {
    expect(invoiceDisplayLabel(null, "abc12345-0000-4000-8000-000000000000")).toBe("Invoice ABC12345");
  });

  it("feesInvoiceCounts and filterFeeInvoices match invoice KPI filters", () => {
    const invoices = [
      { status: "sent" as const, invoice_number: "FEE-001", student_name: "Aarav Sharma", student_code: "STU-001" },
      { status: "paid" as const, invoice_number: "FEE-002", student_name: "Meera Reddy", student_code: "STU-002" },
      { status: "overdue" as const, invoice_number: "FEE-003", student_name: "Kabir", student_code: null },
    ];
    expect(feesInvoiceCounts(invoices)).toEqual({ outstanding: 1, paid: 1, overdue: 1, total: 3 });
    expect(filterFeeInvoices(invoices, "paid", "").map((row) => row.invoice_number)).toEqual(["FEE-002"]);
    expect(filterFeeInvoices(invoices, "all", "aarav")).toHaveLength(1);
  });
});
