/**
 * SQL helpers for E2E (stale SLA backdate). Uses same connection resolution as scripts/run-rls-tests.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { hasDatabaseUrl, loadE2EEnv } from "./env";

const root = process.cwd();

function readPoolerTemplate(): string | null {
  const p = path.join(root, "supabase", ".temp", "pooler-url");
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8").trim();
  return raw.includes("[YOUR-PASSWORD]") ? raw : null;
}

function resolveConnectionString(): string | null {
  loadE2EEnv();
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const template = readPoolerTemplate();
  if (password && template) {
    return template.replace("[YOUR-PASSWORD]", encodeURIComponent(password));
  }
  return null;
}

export async function withSqlClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD required for SQL E2E helpers");
  }
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    throw new Error("Could not resolve Postgres connection string for E2E SQL helpers");
  }
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Backdate assigned_at / stale_at so brand Stale filter picks up the lead (E2E-06). */
export async function backdateLeadStale(leadId: string, daysAgo = 20): Promise<void> {
  await withSqlClient(async (client) => {
    await client.query(
      `UPDATE public.leads
       SET assigned_at = now() - ($2::text || ' days')::interval,
           stale_at = now() - interval '1 day',
           last_center_action_at = NULL,
           updated_at = now()
       WHERE id = $1::uuid`,
      [leadId, String(daysAgo)]
    );
  });
}

export async function findLeadIdByWhatsapp(brandId: string, whatsappE164: string): Promise<string | null> {
  return withSqlClient(async (client) => {
    const wa = whatsappE164.startsWith("+")
      ? whatsappE164
      : `+91${whatsappE164.replace(/\D/g, "").slice(-10)}`;
    const res = await client.query<{ id: string }>(
      `SELECT id::text FROM public.leads
       WHERE brand_id = $1::uuid AND whatsapp_e164 = $2
       ORDER BY created_at DESC LIMIT 1`,
      [brandId, wa]
    );
    return res.rows[0]?.id ?? null;
  });
}
