import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BillingInvoiceRow,
  BillingInvoicesPanel,
  BillingPageHeader,
  BillingStack,
  BillingStatusBadge,
  BillingSubscriptionCard,
  Button,
  MutationError,
} from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { usePlatformIntegration } from "@/hooks/usePlatformIntegration";
import { fetchBrandBillingSummary } from "@/lib/brandBillingApi";
import {
  BILLING_INVOICES_EMPTY_DESCRIPTION,
  BILLING_PAGE_SUBTITLE,
  BILLING_SUBSCRIPTION_DESCRIPTION,
  formatSubscriptionPrice,
  resolveSubscriptionPlan,
  subscriptionStatusBadge,
} from "@/lib/brandBillingHelpers";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { createBrandSubscriptionCheckout } from "@/services/payments/brandSubscriptionCheckout";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import "./brandBilling.css";

const SUBSCRIPTION_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M10 9l5 3-5 3V9z" />
  </svg>
);

const INVOICES_HEAD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const INVOICES_EMPTY_ICON = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

export function BrandBillingPage() {
  const { brandId, missingBrand } = useBrandScope();
  const paymentGatewayEnabled = usePlatformIntegration("payment_gateway");
  const { error, clear, capture } = useMutationError();

  const billing = useQuery({
    queryKey: ["brand-billing", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandBillingSummary(brandId!),
  });

  const checkout = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const { data, error: err } = await createBrandSubscriptionCheckout(brandId);
      if (err) throw new Error(err);
      if (data?.status === "disabled") {
        throw new Error(String(data.message ?? "Payment gateway is disabled by platform admin."));
      }
      if (data?.status === "stub") {
        throw new Error(
          String(data.message ?? "Payment gateway not configured. Contact EduNudg to enable Razorpay.")
        );
      }
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const sub = billing.data?.subscription;
  const plan = resolveSubscriptionPlan(sub?.subscription_plans);
  const status = subscriptionStatusBadge(sub?.status ?? "");
  const invoices = billing.data?.invoices ?? [];

  const statusBadge = <BillingStatusBadge label={status.label} tone={status.tone} />;

  const payAction = paymentGatewayEnabled ? (
    <Button onClick={() => checkout.mutate()} disabled={checkout.isPending}>
      Pay platform subscription
    </Button>
  ) : (
    <p className="ed-text-sm ed-muted ed-billing-subscription-card__gateway-note">
      Payment checkout is disabled platform-wide. Your subscription and invoice history are unchanged.
    </p>
  );

  return (
    <div className="ed-brand-billing-page">
      <BillingPageHeader title="Billing" subtitle={BILLING_PAGE_SUBTITLE} />
      <MutationError message={error} />

      <BillingStack>
        <BillingSubscriptionCard
          icon={SUBSCRIPTION_ICON}
          description={BILLING_SUBSCRIPTION_DESCRIPTION}
          planName={plan?.name ?? "—"}
          statusBadge={statusBadge}
          priceLabel={plan ? formatSubscriptionPrice(plan.price_cents, plan.currency) : "—"}
          action={payAction}
        />

        <BillingInvoicesPanel
          headIcon={INVOICES_HEAD_ICON}
          emptyIcon={INVOICES_EMPTY_ICON}
          emptyDescription={BILLING_INVOICES_EMPTY_DESCRIPTION}
          isEmpty={invoices.length === 0}
        >
          {invoices.map((inv) => (
            <BillingInvoiceRow
              key={inv.id}
              amount={formatInrFromPaise(inv.amount_cents, inv.currency)}
              badge={<BillingStatusBadge label={inv.status.toUpperCase()} tone="draft" />}
              meta={
                <>
                  <div>{new Date(inv.created_at).toLocaleDateString()}</div>
                  {inv.due_at ? <div>Due {new Date(inv.due_at).toLocaleDateString()}</div> : null}
                </>
              }
            />
          ))}
        </BillingInvoicesPanel>
      </BillingStack>
    </div>
  );
}
