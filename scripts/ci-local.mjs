#!/usr/bin/env node
/**
 * Local mirror of .github/workflows/ci.yml (build-test + e2e).
 * Exit non-zero on first failure. Agents use this before git push.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skipE2e = process.argv.includes("--skip-e2e");
const skipRls = process.argv.includes("--skip-rls");

function run(label, command, args) {
  console.log(`\n==> ${label}\n$ ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\nci:local FAILED at: ${label} (exit ${result.status ?? "null"})\n`);
    process.exit(result.status ?? 1);
  }
}

console.log("EduNudg local CI (mirrors GitHub Actions CI)\n");

run("install", "pnpm", ["install"]);
run("assert workspace vitest bins", "node", ["scripts/assert-workspace-test-bins.mjs"]);
run("audit:schema", "pnpm", ["audit:schema"]);
run("build", "pnpm", ["build"]);
run("typecheck", "pnpm", ["typecheck"]);
run("test", "pnpm", ["test"]);

if (!skipRls) {
  run("test:rls", "pnpm", ["test:rls"]);
} else {
  console.log("\n==> test:rls SKIPPED (--skip-rls)\n");
}

if (!skipE2e) {
  const playwrightBin = join(root, "node_modules", ".bin", "playwright");
  if (!existsSync(playwrightBin) && !existsSync(`${playwrightBin}.cmd`)) {
    console.error("Playwright CLI missing — run pnpm install");
    process.exit(1);
  }
  run("playwright chromium", "pnpm", ["exec", "playwright", "install", "chromium"]);
  run("test:e2e", "pnpm", ["test:e2e"]);
} else {
  console.log("\n==> test:e2e SKIPPED (--skip-e2e)\n");
}

console.log("\nci:local PASSED (matches CI jobs build-test + e2e)\n");
