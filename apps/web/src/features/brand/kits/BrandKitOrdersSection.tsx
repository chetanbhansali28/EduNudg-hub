import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, DataList, ListRow, MutationError, Select } from "@edunudg/ui";
import {
  KIT_ORDER_STATUSES,
  listBrandKitOrders,
  type KitOrderRow,
  type KitOrderStatus,
  updateKitOrderStatus,
} from "@/lib/kitOrdersApi";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string };

function centerLabel(order: KitOrderRow): string {
  const center = Array.isArray(order.franchise_centers)
    ? order.franchise_centers[0]
    : order.franchise_centers;
  return center?.display_name ?? center?.name ?? order.center_id.slice(0, 8);
}

function lineLabel(line: KitOrderRow["kit_order_lines"][number]): string {
  const catalog = Array.isArray(line.kit_catalog) ? line.kit_catalog[0] : line.kit_catalog;
  return `${catalog?.name ?? "Item"} × ${line.quantity} (${formatInrFromPaise(line.unit_price_cents)} each)`;
}

export function BrandKitOrdersSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const orders = useQuery({
    queryKey: ["brand-kit-orders", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandKitOrders(brandId),
  });

  const statusUpdate = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: KitOrderStatus }) => {
      clear();
      await updateKitOrderStatus(orderId, status);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brand-kit-orders", brandId] }),
    onError: capture,
  });

  return (
    <>
      <MutationError message={error} />
      <DataList
        items={orders.data ?? []}
        empty="No center kit orders yet."
        render={(order) => (
          <ListRow>
            <div>
              <strong>{centerLabel(order)}</strong>
              <div className="ed-text-sm ed-muted">{new Date(order.created_at).toLocaleString()}</div>
              <Badge>{order.status}</Badge>
              <ul className="ed-text-sm">
                {order.kit_order_lines.map((line) => (
                  <li key={line.id}>{lineLabel(line)}</li>
                ))}
              </ul>
              {order.status !== "fulfilled" && order.status !== "cancelled" && (
                <Select
                  label="Update status"
                  value={order.status}
                  onChange={(status) =>
                    statusUpdate.mutate({ orderId: order.id, status: status as KitOrderStatus })
                  }
                  options={KIT_ORDER_STATUSES.filter((s) => s !== "submitted" || order.status === "submitted").map(
                    (s) => ({ value: s, label: s })
                  )}
                />
              )}
            </div>
          </ListRow>
        )}
      />
    </>
  );
}
