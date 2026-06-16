import { describe, expect, it } from "vitest";
import {
  computeInvoiceStatusAfterPayment,
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
});
