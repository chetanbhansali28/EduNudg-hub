import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type MerchandiseOrderLineRow = {
  id: string;
  quantity: number;
  unit_price_cents: number;
  catalog_item_id: string;
  student_id: string | null;
  merchandise_catalog?: { name: string; sku: string } | { name: string; sku: string }[] | null;
};

export type MerchandiseOrderRow = {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  center_id: string;
  shipping_mode: string | null;
  shipping_address: Record<string, unknown> | null;
  shipping_tracking: Record<string, unknown> | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  franchise_centers?: { name: string; display_name: string | null } | { name: string; display_name: string | null }[] | null;
  merchandise_order_lines: MerchandiseOrderLineRow[];
  merchandise_invoices?: { id: string; invoice_number: string; status: string; due_at: string } | { id: string; invoice_number: string; status: string; due_at: string }[] | null;
};

export type MerchandiseAllocationRow = {
  id: string;
  student_id: string;
  created_at: string;
  students?: { full_name: string } | { full_name: string }[] | null;
  merchandise_order_lines?: {
    quantity: number;
    merchandise_catalog?: { name: string } | { name: string }[] | null;
  } | {
    quantity: number;
    merchandise_catalog?: { name: string } | { name: string }[] | null;
  }[] | null;
};

export const MERCHANDISE_ORDER_STATUSES = [
  "awaiting_payment",
  "placed",
  "approved",
  "shipped",
  "received",
  "complete",
  "cancelled",
] as const;

export type MerchandiseOrderStatus = (typeof MERCHANDISE_ORDER_STATUSES)[number];

export type MerchandiseShippingMode = "franchise" | "student" | "custom";
export type MerchandisePaymentMethod = "razorpay" | "invoice";

const ORDER_SELECT =
  "id, status, payment_status, payment_method, created_at, center_id, shipping_mode, shipping_address, shipping_tracking, subtotal_cents, discount_cents, total_cents, merchandise_order_lines(id, quantity, unit_price_cents, catalog_item_id, student_id, merchandise_catalog(name, sku)), merchandise_invoices(id, invoice_number, status, due_at)";

export async function listCenterMerchandiseOrders(centerId: string): Promise<MerchandiseOrderRow[]> {
  const { data, error } = await getSupabase()
    .from("merchandise_orders")
    .select(ORDER_SELECT)
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as MerchandiseOrderRow[];
}

export async function listBrandMerchandiseOrders(brandId: string): Promise<MerchandiseOrderRow[]> {
  const { data, error } = await getSupabase()
    .from("merchandise_orders")
    .select(`${ORDER_SELECT}, franchise_centers(name, display_name)`)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as MerchandiseOrderRow[];
}

export async function createCenterMerchandiseOrder(
  brandId: string,
  centerId: string,
  input: {
    lines: { catalogItemId: string; quantity: number; unitPriceCents: number; studentId?: string }[];
    shippingMode: MerchandiseShippingMode;
    shippingAddress: Record<string, unknown>;
    promoCode?: string;
    paymentMethod: MerchandisePaymentMethod;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_center_merchandise_order_rpc", {
    p_brand_id: brandId,
    p_center_id: centerId,
    p_lines: input.lines.map((l) => ({
      catalog_item_id: l.catalogItemId,
      quantity: l.quantity,
      unit_price_cents: l.unitPriceCents,
      student_id: l.studentId ?? null,
    })),
    p_shipping_mode: input.shippingMode,
    p_shipping_address: input.shippingAddress,
    p_promo_code: input.promoCode?.trim() || null,
    p_payment_method: input.paymentMethod,
  });
  if (error) throw error;
  return data as string;
}

export async function updateMerchandiseOrderStatus(
  orderId: string,
  status: string,
  shippingTracking?: Record<string, unknown>
): Promise<void> {
  const { error } = await getSupabase().rpc("update_merchandise_order_status_rpc", {
    p_order_id: orderId,
    p_status: status,
    p_shipping_tracking: shippingTracking ?? null,
  });
  if (error) throw error;
}

export async function markMerchandiseOrderReceived(orderId: string): Promise<void> {
  const { error } = await getSupabase().rpc("mark_merchandise_order_received_rpc", { p_order_id: orderId });
  if (error) throw error;
}

export async function completeMerchandiseOrder(orderId: string): Promise<void> {
  const { error } = await getSupabase().rpc("complete_merchandise_order_rpc", { p_order_id: orderId });
  if (error) throw error;
}

export async function recordMerchandisePayment(
  orderId: string,
  amountCents: number,
  method: string,
  notes?: string
): Promise<void> {
  const { error } = await getSupabase().rpc("record_merchandise_payment", {
    p_order_id: orderId,
    p_amount_cents: amountCents,
    p_method: method,
    p_reference_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function upsertMerchandiseCatalogItem(
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
  const { data, error } = await getSupabase().rpc("upsert_merchandise_catalog_item", {
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

export async function deleteMerchandiseCatalogItem(brandId: string, itemId: string): Promise<void> {
  const { removeAllMerchandiseProductPhotos } = await import("@/lib/merchandiseProductPhotoStorage");
  await removeAllMerchandiseProductPhotos(brandId, itemId).catch(() => undefined);
  const { error } = await getSupabase().rpc("delete_merchandise_catalog_item", {
    p_brand_id: brandId,
    p_id: itemId,
  });
  if (error) throw error;
}

export async function listActiveMerchandiseCatalog(brandId: string) {
  const { data, error } = await getSupabase()
    .from("merchandise_catalog")
    .select("id, sku, name, price_cents, currency, photo_urls")
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
    photo_urls: string[] | null;
  }[];
}

export async function validateMerchandisePromoCode(brandId: string, code: string, totalQuantity: number) {
  const { data, error } = await getSupabase().rpc("validate_merchandise_promo_code", {
    p_brand_id: brandId,
    p_code: code.trim(),
    p_total_quantity: totalQuantity,
  });
  if (error) throw error;
  return data as { valid: boolean; message?: string; discount_type?: string; discount_value?: number };
}

export async function upsertMerchandisePromoCode(
  brandId: string,
  input: {
    id?: string;
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    minQuantity?: number;
    description?: string;
    maxUses?: number;
    isActive?: boolean;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_merchandise_promo_code", {
    p_brand_id: brandId,
    p_code: input.code,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_min_quantity: input.minQuantity ?? 1,
    p_description: input.description ?? null,
    p_max_uses: input.maxUses ?? null,
    p_is_active: input.isActive ?? true,
    p_id: input.id ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function listMerchandisePromoCodes(brandId: string) {
  const { data, error } = await getSupabase()
    .from("merchandise_promo_codes")
    .select("id, code, description, discount_type, discount_value, min_quantity, max_uses, use_count, is_active")
    .eq("brand_id", brandId)
    .order("code");
  if (error) throw error;
  return supabaseList(data, null);
}

export async function listFulfillableMerchandiseOrderLines(centerId: string) {
  const orders = await listCenterMerchandiseOrders(centerId);
  return orders
    .filter((o) => ["approved", "shipped", "received", "complete"].includes(o.status))
    .flatMap((o) =>
      o.merchandise_order_lines
        .filter((line) => !line.student_id)
        .map((line) => ({
          orderLineId: line.id,
          orderId: o.id,
          orderStatus: o.status,
          quantity: line.quantity,
          catalogName: Array.isArray(line.merchandise_catalog)
            ? line.merchandise_catalog[0]?.name
            : line.merchandise_catalog?.name,
        }))
    );
}

export async function listCenterMerchandiseAllocations(centerId: string): Promise<MerchandiseAllocationRow[]> {
  const { data, error } = await getSupabase()
    .from("student_merchandise_allocations")
    .select(
      "id, student_id, created_at, students(full_name), merchandise_order_lines(quantity, merchandise_catalog(name))"
    )
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as MerchandiseAllocationRow[];
}

export async function allocateStudentMerchandise(
  centerId: string,
  studentId: string,
  orderLineId: string
): Promise<string> {
  const { data, error } = await getSupabase().rpc("allocate_student_merchandise", {
    p_center_id: centerId,
    p_student_id: studentId,
    p_order_line_id: orderLineId,
  });
  if (error) throw error;
  return data as string;
}
