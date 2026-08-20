import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
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

let loaded = false;
export function loadE2EEnv() {
  if (loaded) return;
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env"));
  loadEnvFile(path.join(root, "apps/web/.env"));
  loadEnvFile(path.join(root, "apps/web/.env.local"));
  loaded = true;
}

/** True when Supabase is configured for authenticated / mutation golden paths. */
export function hasE2EBackend(): boolean {
  loadE2EEnv();
  const url = process.env.VITE_SUPABASE_URL?.trim() ?? "";
  const key = process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
  return Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && key !== "your-anon-public-key");
}

/** True when DATABASE_URL (or RLS pooler) is available for SQL helpers (stale backdate). */
export function hasDatabaseUrl(): boolean {
  loadE2EEnv();
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_PASSWORD?.trim());
}

export const E2E_USERS = {
  platform: { email: "admin@edunudg.com", password: "admin1" },
  brand: { email: "owner@edunudg.com", password: "admin" },
  center: { email: "center@edunudg.com", password: "admin" },
  student: { email: "student@edunudg.com", password: "admin" },
} as const;

export type E2EPersona = keyof typeof E2E_USERS;

export function authStatePath(persona: E2EPersona): string {
  return path.join(root, "e2e", ".auth", `${persona}.json`);
}
