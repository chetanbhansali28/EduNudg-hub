import { getSupabase } from "@/lib/supabase";

export async function startMerchandiseRazorpayCheckout(
  orderId: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await getSupabase().functions.invoke("merchandise-razorpay-checkout", {
    body: { order_id: orderId },
  });
  if (error) return { data: null, error: error.message };
  return { data: data as Record<string, unknown>, error: null };
}

export async function confirmMerchandiseRazorpayPayment(
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  amountCents: number
): Promise<void> {
  const { error } = await getSupabase().rpc("record_merchandise_payment", {
    p_order_id: orderId,
    p_amount_cents: amountCents,
    p_method: "razorpay",
    p_razorpay_payment_id: razorpayPaymentId,
    p_razorpay_order_id: razorpayOrderId,
  });
  if (error) throw error;
}
