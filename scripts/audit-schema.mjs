#!/usr/bin/env node
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const MIGRATIONS = join(process.cwd(), "supabase/migrations");
const APPEND_ONLY = new Set([
  "financial_events",
  "platform_audit_logs",
  "enrollment_history",
  "brand_status_events",
  "auth_audit_logs",
]);

const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"));
const tables = new Map();

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS, file), "utf8");
  const creates = [...sql.matchAll(/CREATE TABLE (?:public\.)?(\w+)/gi)];
  for (const [, name] of creates) {
    if (!tables.has(name)) tables.set(name, { file, hasCreatedBy: false, hasUpdatedBy: false });
    const t = tables.get(name);
    if (/created_by/.test(sql)) t.hasCreatedBy = true;
    if (/updated_by/.test(sql)) t.hasUpdatedBy = true;
  }
}

let failed = false;
for (const [name, meta] of tables) {
  if (name === "profiles") continue;
  if (APPEND_ONLY.has(name)) {
    if (!meta.hasCreatedBy) {
      console.error(`[audit] ${name}: append-only must have created_by`);
      failed = true;
    }
    continue;
  }
  if (!meta.hasUpdatedBy || !meta.hasCreatedBy) {
    console.error(`[audit] ${name}: missing created_by or updated_by (${meta.file})`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`[audit] ${tables.size} tables checked — OK`);
