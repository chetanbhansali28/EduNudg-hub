import { formatInrFromPaise } from "@/lib/inrCurrency";

export type SubscriptionStatusBadge = {
  label: string;
  tone: "active" | "draft" | "warning";
};

export function subscriptionStatusBadge(status: string): SubscriptionStatusBadge {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active" || normalized === "trialing") {
    return { label: "ACTIVE", tone: "active" };
  }
  if (normalized === "past_due" || normalized === "unpaid") {
    return { label: "PAST DUE", tone: "warning" };
  }
  if (!normalized) {
    return { label: "DRAFT", tone: "draft" };
  }
  return { label: normalized.replace(/_/g, " ").toUpperCase(), tone: "draft" };
}

export function formatSubscriptionPrice(
  priceCents: number,
  currency: string,
  interval = "month"
): string {
  return `${formatInrFromPaise(priceCents, currency)}/${interval}`;
}

export type SubscriptionPlanSummary = {
  name: string;
  price_cents: number;
  currency: string;
};

export function resolveSubscriptionPlan(
  plan: SubscriptionPlanSummary | SubscriptionPlanSummary[] | null | undefined
): SubscriptionPlanSummary | null {
  if (!plan) return null;
  if (Array.isArray(plan)) return plan[0] ?? null;
  return plan;
}

export const BILLING_PAGE_SUBTITLE =
  "Manage your franchise subscription and view transaction history.";

export const BILLING_SUBSCRIPTION_DESCRIPTION =
  "Pay your EduNudg platform fee. Franchise centers are not billed by EduNudg directly.";

export const BILLING_INVOICES_EMPTY_DESCRIPTION =
  "Transaction history will appear here once billing begins.";
