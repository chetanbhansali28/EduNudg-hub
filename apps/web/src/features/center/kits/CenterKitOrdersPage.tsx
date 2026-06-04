import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageGrid,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { createCenterKitOrder, listActiveKitCatalog, listCenterKitOrders } from "@/lib/kitOrdersApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

export function CenterKitOrdersPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [catalogItemId, setCatalogItemId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const catalog = useQuery({
    queryKey: ["kit-catalog-active", brandId],
    enabled: !!brandId,
    queryFn: () => listActiveKitCatalog(brandId!),
  });

  const orders = useQuery({
    queryKey: ["center-kit-orders", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterKitOrders(centerId!),
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!brandId || !centerId || !catalogItemId) throw new Error("Missing context");
      clear();
      const item = catalog.data?.find((c) => c.id === catalogItemId);
      if (!item) throw new Error("Item not found");
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      await createCenterKitOrder(brandId, centerId, [
        { catalogItemId: item.id, quantity: qty, unitPriceCents: item.price_cents },
      ]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-kit-orders", centerId] });
      setCatalogItemId("");
      setQuantity("1");
    },
    onError: capture,
  });

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  return (
    <>
      <PageTitle>Kit orders</PageTitle>
      <MutationError message={error} />

      <PageGrid cols={2}>
        <Card title="Place order">
          <Select
            label="Kit item"
            value={catalogItemId}
            onChange={setCatalogItemId}
            placeholder="Select kit"
            options={(catalog.data ?? []).map((c) => ({
              value: c.id,
              label: `${c.name} (₹${(c.price_cents / 100).toFixed(0)})`,
            }))}
          />
          <FormGrid>
            <Input label="Quantity" value={quantity} onChange={setQuantity} />
          </FormGrid>
          <Button onClick={() => placeOrder.mutate()} disabled={!catalogItemId || placeOrder.isPending}>
            Submit order to brand
          </Button>
        </Card>

        <Card title="Order history">
          <DataList
            items={orders.data ?? []}
            empty="No kit orders yet."
            render={(o) => (
              <ListRow>
                <div>
                  <strong>Order {o.id.slice(0, 8)}</strong>
                  <div className="ed-text-sm ed-muted">{new Date(o.created_at).toLocaleString()}</div>
                  <Badge>{o.status}</Badge>
                  <div className="ed-text-sm">
                    {o.kit_order_lines?.length ?? 0} line(s)
                  </div>
                </div>
              </ListRow>
            )}
          />
        </Card>
      </PageGrid>
    </>
  );
}
