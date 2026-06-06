// Platform admin: provision brand owner Auth user + membership (service role + caller JWT)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  brandId?: string;
  email?: string;
  password?: string;
  fullName?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match?.id) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
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
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  if (!authHeader) {
    return jsonResponse({ error: "Authorization required" }, 401);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const brandId = body.brandId?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() ?? "";
  const fullName = body.fullName?.trim() ?? "";

  if (!brandId || !email) {
    return jsonResponse({ error: "brandId and email are required" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();
  if (callerError || !caller) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc("is_platform_admin");
  if (adminError) {
    return jsonResponse({ error: adminError.message }, 500);
  }
  if (!isAdmin) {
    return jsonResponse({ error: "Platform admin required" }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = await findUserIdByEmail(adminClient, email);

  if (!userId) {
    if (!password) {
      return jsonResponse({ error: "Password required for a new brand login" }, 400);
    }
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });
    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }
    userId = created.user?.id ?? null;
  } else if (password) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }
  }

  if (!userId) {
    return jsonResponse({ error: "Failed to resolve auth user" }, 500);
  }

  const { error: syncError } = await adminClient.rpc("sync_brand_owner_membership", {
    p_brand_id: brandId,
    p_user_id: userId,
    p_email: email,
    p_full_name: fullName || null,
    p_actor_id: caller.id,
  });

  if (syncError) {
    return jsonResponse({ error: syncError.message }, 400);
  }

  return jsonResponse({ ok: true, userId, loginEmail: email });
});
