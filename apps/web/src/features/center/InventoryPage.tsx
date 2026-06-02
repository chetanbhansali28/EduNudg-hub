import { useQuery } from "@tanstack/react-query";
import { Card, DataList, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function InventoryPage() {
  const tenant = useTenant();
  const stock = useQuery({
    queryKey: ["inventory-stock", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("inventory_stock").select("id, quantity, item_id");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  return (
    <>
      <PageTitle>Inventory</PageTitle>
      <Card>
        <DataList
          items={(stock.data ?? []).map((s) => (s))}
          empty="No stock records."
          render={(s) => <span>Qty: {s.quantity}</span>}
        />
      </Card>
    </>
  );
}
