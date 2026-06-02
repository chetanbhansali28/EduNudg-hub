// EduNudg passkey verification stub — use @simplewebauthn/server in production

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  return new Response(
    JSON.stringify({ ok: true, message: "Passkey verify stub" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
