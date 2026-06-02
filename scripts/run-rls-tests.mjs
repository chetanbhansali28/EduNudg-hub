#!/usr/bin/env node
/**
 * Runs supabase/tests/*.sql against the linked Supabase Postgres (no psql required).
 *
 * Connection resolution (first match wins):
 * 1. DATABASE_URL — use pooler host if direct db.*.supabase.co fails (IPv6 / DNS)
 * 2. SUPABASE_DB_PASSWORD + supabase/.temp/pooler-url (from `supabase link`)
 * 3. Password extracted from DATABASE_URL + pooler template
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function loadEnvFiles() {
  loadEnvFile(join(root, ".env.local"));
  loadEnvFile(join(root, ".env"));
  loadEnvFile(join(root, "apps/web/.env"));
}

function readPoolerTemplate() {
  const path = join(root, "supabase", ".temp", "pooler-url");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8").trim();
  return raw.includes("[YOUR-PASSWORD]") ? raw : null;
}

function readProjectRef() {
  const path = join(root, "supabase", ".temp", "project-ref");
  if (existsSync(path)) {
    return readFileSync(path, "utf8").trim();
  }
  const apiUrl = process.env.VITE_SUPABASE_URL?.trim();
  if (!apiUrl) return null;
  const m = apiUrl.match(/https:\/\/([^.]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

/** Password from postgresql://user:PASSWORD@db.{ref}.supabase.co (handles @ in password). */
function extractPasswordFromDirectDbUrl(url) {
  const marker = "@db.";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const prefix = url.slice(0, idx);
  const credStart = prefix.indexOf("://") + 3;
  const colon = prefix.indexOf(":", credStart);
  if (colon === -1) return null;
  return decodeURIComponent(prefix.slice(colon + 1));
}

function buildPoolerUrl(template, password) {
  const encoded = encodeURIComponent(password);
  return template.replace("[YOUR-PASSWORD]", encoded);
}

function poolerSessionUrl(transactionUrl) {
  if (transactionUrl.includes(":6543/")) {
    return transactionUrl.replace(":6543/", ":5432/");
  }
  return transactionUrl;
}

function isDirectDbHost(url) {
  try {
    const host = new URL(url.replace(/^postgres:/, "postgresql:")).hostname;
    return /^db\.[^.]+\.supabase\.co$/i.test(host);
  } catch {
    return false;
  }
}

function sslForUrl(url) {
  if (/localhost|127\.0\.0\.1/i.test(url)) return undefined;
  return { rejectUnauthorized: false };
}

function resolveCandidateUrls() {
  const candidates = [];
  const seen = new Set();

  const add = (url) => {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  const poolerTemplate = readPoolerTemplate();
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    (process.env.DATABASE_URL ? extractPasswordFromDirectDbUrl(process.env.DATABASE_URL) : null);

  if (poolerTemplate && password) {
    const pooled = buildPoolerUrl(poolerTemplate, password);
    add(pooled);
    add(poolerSessionUrl(pooled));
  }

  const explicit = process.env.DATABASE_URL?.trim();
  if (explicit) {
    if (isDirectDbHost(explicit) && password && poolerTemplate) {
      add(buildPoolerUrl(poolerTemplate, password));
      add(poolerSessionUrl(buildPoolerUrl(poolerTemplate, password)));
    } else {
      add(explicit);
    }
  }

  return { candidates, poolerTemplate, password, projectRef: readProjectRef() };
}

async function tryConnect(databaseUrl) {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: sslForUrl(databaseUrl),
  });
  await client.connect();
  return client;
}

async function main() {
  loadEnvFiles();

  const { candidates, poolerTemplate, password, projectRef } = resolveCandidateUrls();

  if (candidates.length === 0) {
    console.log("Skipping RLS tests: no database connection available.");
    console.log("");
    console.log("Set one of:");
    console.log("  • DATABASE_URL — Session pooler URI from Dashboard → Database (IPv4)");
    console.log("    Example: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres");
    console.log("  • SUPABASE_DB_PASSWORD — after `supabase link` (uses supabase/.temp/pooler-url)");
    console.log("");
    console.log("See docs/ops/supabase-cloud-setup.md");
    process.exit(0);
  }

  const testsDir = join(root, "supabase", "tests");
  const files = readdirSync(testsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No SQL files found in supabase/tests/");
    process.exit(1);
  }

  let client = null;
  let lastError = null;
  let usedUrl = null;

  for (const url of candidates) {
    try {
      client = await tryConnect(url);
      usedUrl = url;
      break;
    } catch (err) {
      lastError = err;
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
        continue;
      }
      throw err;
    }
  }

  if (!client) {
    console.error("RLS tests failed: could not connect to Postgres.");
    if (lastError instanceof Error) {
      console.error(`  Last error: ${lastError.message}`);
    }
    if (isDirectDbHost(process.env.DATABASE_URL ?? "")) {
      console.error("");
      console.error("  The host db.[ref].supabase.co is often IPv6-only or unavailable on your network.");
      console.error("  Use the Session pooler URI (port 5432) from Dashboard → Database, or:");
      console.error("    export SUPABASE_DB_PASSWORD='your-db-password'");
      console.error("    pnpm test:rls   # uses supabase/.temp/pooler-url after supabase link");
    }
    if (!poolerTemplate) {
      console.error("");
      console.error(`  Run: supabase link --project-ref ${projectRef ?? "YOUR_REF"}`);
    } else if (!password) {
      console.error("");
      console.error("  Set SUPABASE_DB_PASSWORD (database password, not anon key).");
      console.error("  If your password contains @, avoid raw DATABASE_URL — use SUPABASE_DB_PASSWORD instead.");
    }
    process.exit(1);
  }

  const safeHost = (() => {
    try {
      return new URL(usedUrl.replace(/^postgres:/, "postgresql:")).host;
    } catch {
      return "(connected)";
    }
  })();

  try {
    console.log(`Connected via ${safeHost}`);
    for (const file of files) {
      const sql = readFileSync(join(testsDir, file), "utf8");
      console.log(`Running ${file}...`);
      await client.query(sql);
    }
    console.log("RLS tests passed.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`RLS tests failed: ${message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main();
