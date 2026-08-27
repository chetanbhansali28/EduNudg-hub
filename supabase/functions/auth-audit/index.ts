// Auth audit ingest: RPC writer + optional IP/country stamp (service role).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENT_TYPES = new Set(["login_success", "login_failure", "logout", "access_denied"]);
const PORTALS = new Set(["platform", "brand", "center", "learn", "parents"]);
const PROVIDERS = new Set(["google", "facebook", "whatsapp", "passkey", "email", "magic_link"]);

interface RequestBody {
  eventType?: string;
  provider?: string | null;
  sessionId?: string | null;
  portal?: string | null;
  brandId?: string | null;
  centerId?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  identifier?: string | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

function clientCountry(req: Request): string | null {
  const cf = req.headers.get("cf-ipcountry")?.trim();
  if (cf && cf !== "XX") return cf.slice(0, 8);
  const vercel = req.headers.get("x-vercel-ip-country")?.trim();
  return vercel ? vercel.slice(0, 8) : null;
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const eventType = (body.eventType ?? "").trim().toLowerCase();
  if (!EVENT_TYPES.has(eventType)) {
    return jsonResponse({ error: "Invalid eventType" }, 400);
  }

  const providerRaw = body.provider?.trim().toLowerCase() ?? "";
  const provider = PROVIDERS.has(providerRaw) ? providerRaw : null;
  const portalRaw = body.portal?.trim().toLowerCase() ?? "";
  const portal = PORTALS.has(portalRaw) ? portalRaw : null;

  const authHeader = req.headers.get("Authorization");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rowId, error: rpcError } = await userClient.rpc("log_auth_audit_event", {
    p_event_type: eventType,
    p_provider: provider,
    p_session_id: body.sessionId ?? null,
    p_portal: portal,
    p_brand_id: body.brandId ?? null,
    p_center_id: body.centerId ?? null,
    p_user_agent: body.userAgent ?? null,
    p_metadata: body.metadata ?? {},
    p_identifier: body.identifier ?? null,
  });

  if (rpcError) {
    return jsonResponse({ error: rpcError.message }, 400);
  }

  const id = typeof rowId === "string" ? rowId : null;
  if (!id) {
    return jsonResponse({ ok: true, skipped: true });
  }

  const ip = clientIp(req);
  const country = clientCountry(req);
  const hmacSecret = Deno.env.get("AUTH_AUDIT_HMAC_SECRET") ?? serviceRoleKey;
  const ipHash = ip ? await hmacSha256Hex(hmacSecret, ip) : null;

  if (ip || ipHash || country) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin
      .from("auth_audit_logs")
      .update({
        ip_address: ip,
        ip_hash: ipHash,
        ip_country: country,
      })
      .eq("id", id);
  }

  return jsonResponse({ ok: true, id });
});
