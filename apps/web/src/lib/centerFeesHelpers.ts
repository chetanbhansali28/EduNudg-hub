import { formatInrFromPaise } from "@/lib/inrCurrency";

export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

export type InvoiceStatusTone = "default" | "success" | "warning" | "danger";

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export const CREATE_INVOICE_STATUS_OPTIONS = INVOICE_STATUS_OPTIONS.filter((option) =>
  ["draft", "sent", "overdue"].includes(option.value)
);

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
];

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function invoiceStatusTone(status: InvoiceStatus): InvoiceStatusTone {
  if (status === "paid") return "success";
  if (status === "partial") return "warning";
  if (status === "overdue") return "danger";
  if (status === "cancelled") return "default";
  return "default";
}

export function isInvoicePayable(status: InvoiceStatus): boolean {
  return status === "sent" || status === "partial" || status === "overdue";
}

export function computeInvoiceStatusAfterPayment(
  invoiceAmountCents: number,
  paidTotalCents: number,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  if (currentStatus === "cancelled") return "cancelled";
  if (paidTotalCents >= invoiceAmountCents) return "paid";
  if (paidTotalCents > 0) return "partial";
  return currentStatus === "overdue" ? "overdue" : "sent";
}

export function formatFeeDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function invoiceDisplayLabel(invoiceNumber: string | null, id: string): string {
  if (invoiceNumber?.trim()) return invoiceNumber.trim();
  return `Invoice ${id.slice(0, 8).toUpperCase()}`;
}

export function invoiceOptionLabel(input: {
  invoice_number: string | null;
  id: string;
  student_name: string;
  amount_cents: number;
  status: InvoiceStatus;
}): string {
  return `${invoiceDisplayLabel(input.invoice_number, input.id)} · ${input.student_name} · ${formatInrFromPaise(input.amount_cents)} (${invoiceStatusLabel(input.status)})`;
}

export function paymentSummaryLabel(amountCents: number, method: string | null, paidAt: string): string {
  const methodLabel = method ? method.replace(/_/g, " ") : "Payment";
  return `${formatInrFromPaise(amountCents)} via ${methodLabel} on ${formatFeeDate(paidAt)}`;
}

export type FeesSectionTab = "invoices" | "payments";
export type InvoiceListFilter = "all" | "outstanding" | "paid" | "overdue";

export type FeesInvoiceCounts = {
  outstanding: number;
  paid: number;
  overdue: number;
  total: number;
};

export function feesInvoiceCounts(invoices: { status: InvoiceStatus }[]): FeesInvoiceCounts {
  return {
    outstanding: invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "partial").length,
    paid: invoices.filter((invoice) => invoice.status === "paid").length,
    overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
    total: invoices.length,
  };
}

function matchesFeeSearch(values: Array<string | null | undefined>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return values.filter(Boolean).some((value) => value!.toLowerCase().includes(q));
}

export function filterFeeInvoices<T extends { status: InvoiceStatus; invoice_number?: string | null; student_name?: string; student_code?: string | null }>(
  invoices: T[],
  filter: InvoiceListFilter,
  search: string
): T[] {
  return invoices.filter((invoice) => {
    const matchesFilter =
      filter === "outstanding"
        ? invoice.status === "sent" || invoice.status === "partial"
        : filter === "paid"
          ? invoice.status === "paid"
          : filter === "overdue"
            ? invoice.status === "overdue"
            : true;
    return (
      matchesFilter &&
      matchesFeeSearch([invoice.invoice_number, invoice.student_name, invoice.student_code], search)
    );
  });
}

export function filterFeePayments<T extends { student_name?: string | null; invoice_number?: string | null; method?: string | null }>(
  payments: T[],
  search: string
): T[] {
  return payments.filter((payment) =>
    matchesFeeSearch([payment.student_name, payment.invoice_number, payment.method], search)
  );
}

