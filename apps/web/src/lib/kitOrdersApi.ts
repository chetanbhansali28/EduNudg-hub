import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type KitOrderLineRow = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  catalog_item_id: string;
  kit_catalog?: { name: string; sku: string } | { name: string; sku: string }[] | null;
};

export type KitOrderRow = {
  id: string;
  status: string;
  created_at: string;
  center_id: string;
  franchise_centers?: { name: string; display_name: string | null } | { name: string; display_name: string | null }[] | null;
  kit_order_lines: KitOrderLineRow[];
};

export type KitAllocationRow = {
  id: string;
  student_id: string;
  created_at: string;
  students?: { full_name: string } | { full_name: string }[] | null;
  kit_order_lines?: {
    quantity: number;
    kit_catalog?: { name: string } | { name: string }[] | null;
  } | {
    quantity: number;
    kit_catalog?: { name: string } | { name: string }[] | null;
  }[] | null;
};

export const KIT_ORDER_STATUSES = ["submitted", "approved", "shipped", "fulfilled", "cancelled"] as const;

export type KitOrderStatus = (typeof KIT_ORDER_STATUSES)[number];

export async function listCenterKitOrders(centerId: string): Promise<KitOrderRow[]> {
  const { data, error } = await getSupabase()
    .from("kit_orders")
    .select(
      "id, status, created_at, center_id, kit_order_lines(id, quantity, unit_price_cents, catalog_item_id, kit_catalog(name, sku))"
    )
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as KitOrderRow[];
}

export async function listBrandKitOrders(brandId: string): Promise<KitOrderRow[]> {
  const { data, error } = await getSupabase()
    .from("kit_orders")
    .select(
      "id, status, created_at, center_id, franchise_centers(name, display_name), kit_order_lines(id, quantity, unit_price_cents, catalog_item_id, kit_catalog(name, sku))"
    )
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as KitOrderRow[];
}

export async function updateKitOrderStatus(orderId: string, status: KitOrderStatus): Promise<void> {
  const { error } = await getSupabase().rpc("update_kit_order_status_rpc", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
}

export async function createCenterKitOrder(
  brandId: string,
  centerId: string,
  lines: { catalogItemId: string; quantity: number; unitPriceCents: number }[]
): Promise<string> {
  if (lines.length !== 1) {
    throw new Error("One line per order in v1");
  }
  const line = lines[0]!;
  const { data, error } = await getSupabase().rpc("create_center_kit_order_rpc", {
    p_brand_id: brandId,
    p_center_id: centerId,
    p_catalog_item_id: line.catalogItemId,
    p_quantity: line.quantity,
    p_unit_price_cents: line.unitPriceCents,
  });
  if (error) throw error;
  return data as string;
}

export async function upsertKitCatalogItem(
  brandId: string,
  input: {
    id?: string;
    sku: string;
    name: string;
    priceCents: number;
    currency?: string;
    isActive?: boolean;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_kit_catalog_item", {
    p_brand_id: brandId,
    p_id: input.id ?? null,
    p_sku: input.sku.trim(),
    p_name: input.name.trim(),
    p_price_cents: input.priceCents,
    p_currency: input.currency?.trim() || "INR",
    p_is_active: input.isActive ?? true,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteKitCatalogItem(brandId: string, itemId: string): Promise<void> {
  const { error } = await getSupabase().rpc("delete_kit_catalog_item", {
    p_brand_id: brandId,
    p_id: itemId,
  });
  if (error) throw error;
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

export async function listFulfillableOrderLines(centerId: string) {
  const orders = await listCenterKitOrders(centerId);
  return orders
    .filter((o) => ["approved", "shipped", "fulfilled"].includes(o.status))
    .flatMap((o) =>
      o.kit_order_lines.map((line) => ({
        orderLineId: line.id,
        orderId: o.id,
        orderStatus: o.status,
        quantity: line.quantity,
        catalogName: Array.isArray(line.kit_catalog)
          ? line.kit_catalog[0]?.name
          : line.kit_catalog?.name,
      }))
    );
}

export async function listCenterKitAllocations(centerId: string): Promise<KitAllocationRow[]> {
  const { data, error } = await getSupabase()
    .from("student_kit_allocations")
    .select(
      "id, student_id, created_at, students(full_name), kit_order_lines(quantity, kit_catalog(name))"
    )
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as KitAllocationRow[];
}

export async function allocateStudentKit(
  centerId: string,
  studentId: string,
  orderLineId: string
): Promise<string> {
  const { data, error } = await getSupabase().rpc("allocate_student_kit", {
    p_center_id: centerId,
    p_student_id: studentId,
    p_order_line_id: orderLineId,
  });
  if (error) throw error;
  return data as string;
}
