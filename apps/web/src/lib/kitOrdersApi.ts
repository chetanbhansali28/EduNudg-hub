import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type KitOrderRow = {
  id: string;
  status: string;
  created_at: string;
  kit_order_lines: { id: string; quantity: number; unit_price_cents: number; catalog_item_id: string }[];
};

export async function listCenterKitOrders(centerId: string): Promise<KitOrderRow[]> {
  const { data, error } = await getSupabase()
    .from("kit_orders")
    .select("id, status, created_at, kit_order_lines(id, quantity, unit_price_cents, catalog_item_id)")
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as KitOrderRow[];
}

export async function createCenterKitOrder(
  brandId: string,
  centerId: string,
  lines: { catalogItemId: string; quantity: number; unitPriceCents: number }[]
): Promise<string> {
  const { data: order, error: orderErr } = await getSupabase()
    .from("kit_orders")
    .insert({ brand_id: brandId, center_id: centerId, status: "submitted" })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  const orderId = order.id as string;
  const { error: linesErr } = await getSupabase().from("kit_order_lines").insert(
    lines.map((l) => ({
      order_id: orderId,
      catalog_item_id: l.catalogItemId,
      quantity: l.quantity,
      unit_price_cents: l.unitPriceCents,
    }))
  );
  if (linesErr) throw linesErr;
  return orderId;
}

export async function listActiveKitCatalog(brandId: string) {
  const { data, error } = await getSupabase()
    .from("kit_catalog")
    .select("id, sku, name, price_cents, currency")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return supabaseList(data, null) as {
    id: string;
    sku: string;
    name: string;
    price_cents: number;
    currency: string;
  }[];
}
