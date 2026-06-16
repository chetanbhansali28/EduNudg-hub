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
