import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const { order_id: orderId } = await req.json();
  if (!orderId) {
    return new Response(JSON.stringify({ error: "order_id required" }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!razorpayKeyId || !razorpayKeySecret) {
    return new Response(
      JSON.stringify({ status: "stub", message: "Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: order, error: orderErr } = await supabase
    .from("merchandise_orders")
    .select("id, brand_id, total_cents, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
  }

  const amount = order.total_cents;
  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: orderId }),
  });

  if (!razorpayRes.ok) {
    const errText = await razorpayRes.text();
    return new Response(JSON.stringify({ error: errText }), { status: 502 });
  }

  const razorpayOrder = await razorpayRes.json();
  await supabase
    .from("merchandise_orders")
    .update({ razorpay_order_id: razorpayOrder.id, payment_status: "pending" })
    .eq("id", orderId);

  return new Response(
    JSON.stringify({
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: razorpayKeyId,
      amount_cents: amount,
      currency: "INR",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
