import type { SubscriptionPlanFeature, SubscriptionPlanTone } from "@edunudg/ui";
import type { SubscriptionPlanFeatures } from "@/lib/subscriptionPlanFeatures";
import { PLAN_FEATURE_META } from "@/lib/subscriptionPlanFeatures";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { initialsFromName } from "@/lib/welcomeMessage";

export function planToneFromCode(code: string): SubscriptionPlanTone {
  const normalized = code.trim().toLowerCase();
  if (normalized.includes("growth") || normalized.includes("pro")) return "growth";
  if (normalized.includes("enterprise")) return "enterprise";
  if (normalized.includes("starter") || normalized.includes("standard")) return "starter";
  return "neutral";
}

export function planCardFeatures(features: SubscriptionPlanFeatures): SubscriptionPlanFeature[] {
  const limits: SubscriptionPlanFeature[] = [
    {
      key: "centers",
      label:
        features.max_franchise_centers == null
          ? "Unlimited franchise centers"
          : `${features.max_franchise_centers} Franchise centers`,
      included: true,
    },
    {
      key: "students",
      label:
        features.max_students == null
          ? "Unlimited students"
          : `${features.max_students.toLocaleString("en-IN")} Students`,
      included: true,
    },
  ];

  const flags = PLAN_FEATURE_META.filter((meta) => meta.kind === "boolean").map((meta) => ({
    key: meta.key,
    label: meta.label,
    included: Boolean(features[meta.key]),
  }));

  return [...limits, ...flags.slice(0, 4)];
}

export function formatPlanPriceLabel(
  priceCents: number,
  currency: string,
  billingPeriod: "monthly" | "yearly"
): { priceLabel: string; intervalLabel: string } {
  if (billingPeriod === "yearly") {
    const yearlyCents = Math.round(priceCents * 12 * 0.8);
    return {
      priceLabel: formatInrFromPaise(yearlyCents, currency),
      intervalLabel: "/year",
    };
  }

  return {
    priceLabel: formatInrFromPaise(priceCents, currency),
    intervalLabel: "/month",
  };
}

export function subscriptionStatusTone(
  status: string
): "active" | "inactive" | "expired" | "warning" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due") return "warning";
  if (status === "cancelled") return "expired";
  return "inactive";
}

export function subscriptionStatusLabel(status: string): string {
  if (status === "active") return "ACTIVE";
  if (status === "trialing") return "TRIAL";
  if (status === "past_due") return "PAST DUE";
  if (status === "cancelled") return "EXPIRED";
  return status.replace(/_/g, " ").toUpperCase();
}

export function formatBillingDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function brandInitials(name: string): string {
  return initialsFromName(name).slice(0, 2);
}

export function filterBrandSubscriptions<
  T extends { brands?: { name: string } | null; subscription_plans?: { name: string } | null },
>(rows: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    const brand = row.brands?.name?.toLowerCase() ?? "";
    const plan = row.subscription_plans?.name?.toLowerCase() ?? "";
    return brand.includes(needle) || plan.includes(needle);
  });
}

export type BrandSubscriptionSortKey = "brand-asc" | "brand-desc" | "plan-asc" | "plan-desc" | "status-asc" | "status-desc";

export const BRAND_SUBSCRIPTIONS_LIST_CONTROLS_THRESHOLD = 10;
export const BRAND_SUBSCRIPTIONS_PAGE_SIZE = 10;

export const BRAND_SUBSCRIPTION_SORT_OPTIONS: { value: BrandSubscriptionSortKey; label: string }[] = [
  { value: "brand-asc", label: "Brand (A–Z)" },
  { value: "brand-desc", label: "Brand (Z–A)" },
  { value: "plan-asc", label: "Plan (A–Z)" },
  { value: "plan-desc", label: "Plan (Z–A)" },
  { value: "status-asc", label: "Status (A–Z)" },
  { value: "status-desc", label: "Status (Z–A)" },
];

export function shouldShowBrandSubscriptionListControls(totalSubscriptions: number): boolean {
  return totalSubscriptions > BRAND_SUBSCRIPTIONS_LIST_CONTROLS_THRESHOLD;
}

type BrandSubscriptionRow = {
  brands?: { name: string } | null;
  subscription_plans?: { name: string } | null;
  status: string;
};

export function sortBrandSubscriptions<T extends BrandSubscriptionRow>(
  rows: T[],
  sort: BrandSubscriptionSortKey
): T[] {
  const copy = [...rows];
  const brandName = (row: T) => row.brands?.name ?? "";
  const planName = (row: T) => row.subscription_plans?.name ?? "";

  switch (sort) {
    case "brand-asc":
      return copy.sort((a, b) => brandName(a).localeCompare(brandName(b)));
    case "brand-desc":
      return copy.sort((a, b) => brandName(b).localeCompare(brandName(a)));
    case "plan-asc":
      return copy.sort((a, b) => planName(a).localeCompare(planName(b)));
    case "plan-desc":
      return copy.sort((a, b) => planName(b).localeCompare(planName(a)));
    case "status-asc":
      return copy.sort((a, b) => a.status.localeCompare(b.status));
    case "status-desc":
      return copy.sort((a, b) => b.status.localeCompare(a.status));
  }
}

export type BrandSubscriptionsListResult<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
};

export function brandSubscriptionsPaginationSummary(result: BrandSubscriptionsListResult<unknown>): string {
  if (result.total === 0) return "No subscriptions";
  return `${result.rangeStart}–${result.rangeEnd} of ${result.total}`;
}

function paginateBrandSubscriptions<T>(items: T[], page: number, pageSize: number): BrandSubscriptionsListResult<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    page: safePage,
    pageCount,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}

export function resolveBrandSubscriptionsList<T extends BrandSubscriptionRow>(
  rows: T[],
  options: {
    showControls: boolean;
    search: string;
    sort: BrandSubscriptionSortKey;
    page: number;
  }
): BrandSubscriptionsListResult<T> {
  const sorted = sortBrandSubscriptions(rows, options.showControls ? options.sort : "brand-asc");
  if (!options.showControls) {
    return {
      items: sorted,
      page: 1,
      pageCount: 1,
      total: sorted.length,
      rangeStart: sorted.length === 0 ? 0 : 1,
      rangeEnd: sorted.length,
    };
  }

  const filtered = filterBrandSubscriptions(sorted, options.search);
  return paginateBrandSubscriptions(filtered, options.page, BRAND_SUBSCRIPTIONS_PAGE_SIZE);
}

/** Every 2nd plan card (2nd, 4th, 6th, …) is highlighted. */
export function isAlternatingFeaturedPlanCard(index: number): boolean {
  return index % 2 === 1;
}
