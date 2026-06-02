// EduNudg WhatsApp OTP — deploy to Supabase Edge Functions
// Integrate Twilio Verify WhatsApp / Gupshup in production

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  const { phone } = await req.json();
  if (!phone) {
    return new Response(JSON.stringify({ error: "phone required" }), { status: 400 });
  }
  // TODO: rate limit via auth_rate_limits, send OTP via provider
  return new Response(
    JSON.stringify({ ok: true, message: "OTP stub — configure WhatsApp provider" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
