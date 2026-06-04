import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, ListRow, MutationError, PageTitle } from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { fetchBrandBillingSummary } from "@/lib/brandBillingApi";
import { createBrandSubscriptionCheckout } from "@/services/payments/brandSubscriptionCheckout";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR" }).format(cents / 100);
}

export function BrandBillingPage() {
  const { brandId, missingBrand } = useBrandScope();
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
  const plan = sub?.subscription_plans;

  return (
    <>
      <PageTitle>Billing</PageTitle>
      <MutationError message={error} />

      <Card title="Platform subscription">
        <p className="ed-text-sm ed-muted">
          Pay your EduNudg platform fee. Franchise centers are not billed by EduNudg directly.
        </p>
        {sub && (
          <p>
            Plan: <strong>{plan?.name ?? "—"}</strong> · Status: <Badge>{sub.status}</Badge>
            {plan && (
              <span className="ed-text-sm ed-muted"> · {formatMoney(plan.price_cents, plan.currency)}/month</span>
            )}
          </p>
        )}
        <Button onClick={() => checkout.mutate()} disabled={checkout.isPending}>
          Pay platform subscription
        </Button>
      </Card>

      <Card title="Invoices">
        <DataList
          items={billing.data?.invoices ?? []}
          empty="No invoices yet."
          render={(inv) => (
            <ListRow>
              <div>
                <strong>{formatMoney(inv.amount_cents, inv.currency)}</strong>
                <div className="ed-text-sm ed-muted">{new Date(inv.created_at).toLocaleDateString()}</div>
                <Badge>{inv.status}</Badge>
                {inv.due_at && <div className="ed-text-sm">Due {new Date(inv.due_at).toLocaleDateString()}</div>}
              </div>
            </ListRow>
          )}
        />
      </Card>
    </>
  );
}
