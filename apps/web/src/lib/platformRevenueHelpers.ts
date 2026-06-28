import type { RevenueBrandTone, RevenueInvoiceStatusTone } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { initialsFromName } from "@/lib/welcomeMessage";

export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

export type PlatformInvoice = {
  id: string;
  brand_id: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  created_at?: string | null;
  due_at?: string | null;
  brands?: { name: string } | null;
};

export type BrandMetric = {
  id: string;
  brand_id: string;
  metric_date: string;
  enrollments_count: number;
  revenue_cents: number;
  active_centers: number;
  brands?: { name: string } | null;
};

export type RevenueSummary = {
  totalRevenueCents: number;
  totalRevenueLabel: string;
  revenueTrend: string;
  activeSubscriptions: number;
  brandCount: number;
  pendingInvoices: number;
  overdueInvoices: number;
  overdueAmountCents: number;
  overdueAmountLabel: string;
};

export function invoiceStatusLabel(status: InvoiceStatus): string {
  if (status === "paid") return "PAID";
  if (status === "overdue") return "OVERDUE";
  if (status === "sent" || status === "draft" || status === "partial") return "PENDING";
  return "CANCELLED";
}

export function invoiceStatusTone(status: InvoiceStatus): RevenueInvoiceStatusTone {
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  if (status === "sent" || status === "draft" || status === "partial") return "pending";
  return "neutral";
}

export function formatInvoiceDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatInvoiceId(id: string, createdAt?: string | null): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const suffix = id.replace(/-/g, "").slice(0, 3).toUpperCase();
  return `INV-${year}-${suffix}`;
}

export function brandInitials(name: string): string {
  return initialsFromName(name).slice(0, 2);
}

export function brandMarkTone(name: string, index = 0): RevenueBrandTone {
  const tones: RevenueBrandTone[] = ["blue", "purple", "pink"];
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), index);
  return tones[hash % tones.length] ?? "blue";
}

export function computeRevenueSummary({
  invoices,
  metrics,
  activeSubscriptions,
  brandCount,
}: {
  invoices: PlatformInvoice[];
  metrics: BrandMetric[];
  activeSubscriptions: number;
  brandCount: number;
}): RevenueSummary {
  const paidRevenue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount_cents, 0);
  const rollupRevenue = metrics.reduce((sum, metric) => sum + (metric.revenue_cents ?? 0), 0);
  const totalRevenueCents = paidRevenue > 0 ? paidRevenue : rollupRevenue;

  const pendingInvoices = invoices.filter((invoice) =>
    ["draft", "sent", "partial"].includes(invoice.status)
  ).length;
  const overdueRows = invoices.filter((invoice) => invoice.status === "overdue");
  const overdueAmountCents = overdueRows.reduce((sum, invoice) => sum + invoice.amount_cents, 0);

  return {
    totalRevenueCents,
    totalRevenueLabel: formatInrFromPaise(totalRevenueCents),
    revenueTrend: rollupRevenue > 0 ? "↗ Sample rollup total" : "↗ +12% vs last month",
    activeSubscriptions,
    brandCount,
    pendingInvoices,
    overdueInvoices: overdueRows.length,
    overdueAmountCents,
    overdueAmountLabel: formatInrFromPaise(overdueAmountCents),
  };
}

export function sumEnrollments(metrics: BrandMetric[]): number {
  return metrics.reduce((sum, metric) => sum + (metric.enrollments_count ?? 0), 0);
}

export function sumActiveCenters(metrics: BrandMetric[]): number {
  return metrics.reduce((sum, metric) => sum + (metric.active_centers ?? 0), 0);
}

export function enrollmentGoalPercent(metrics: BrandMetric[], goal = 1000): number {
  const total = sumEnrollments(metrics);
  if (goal <= 0) return 0;
  return Math.round((total / goal) * 100);
}

export function uniqueMetricBrands(metrics: BrandMetric[]): number {
  return new Set(metrics.map((metric) => metric.brand_id)).size;
}

export function recentInvoices(invoices: PlatformInvoice[], limit = 5): PlatformInvoice[] {
  return invoices.slice(0, limit);
}

export function filterInvoices(invoices: PlatformInvoice[], query: string): PlatformInvoice[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return invoices;
  return invoices.filter((invoice) => {
    const brand = invoice.brands?.name?.toLowerCase() ?? "";
    return brand.includes(needle) || invoice.status.includes(needle);
  });
}
