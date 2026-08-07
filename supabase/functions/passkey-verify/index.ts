// EduNudg passkey verification — wire @simplewebauthn/server for production sessions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

const NOT_CONFIGURED =
  "Passkey sign-in is not fully configured. Deploy passkey-verify with @simplewebauthn/server.";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: JSON_HEADERS });
  }

  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "verify";

  if (action === "login-options") {
    return new Response(
      JSON.stringify({ configured: false, message: NOT_CONFIGURED }),
      { headers: JSON_HEADERS }
    );
  }

  if (action === "login-verify") {
    return new Response(
      JSON.stringify({ configured: false, message: NOT_CONFIGURED }),
      { headers: JSON_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, message: "Passkey verify stub" }),
    { headers: JSON_HEADERS }
  );
});
