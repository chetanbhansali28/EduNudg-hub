#!/usr/bin/env node
/**
 * Fail fast when workspace packages declare vitest but the install is broken
 * (dangling symlinks under packages/<name>/node_modules/vitest).
 */
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = join(root, "packages");
const errors = [];

for (const name of readdirSync(packagesDir)) {
  const pkgDir = join(packagesDir, name);
  const pkgJsonPath = join(pkgDir, "package.json");
  if (!existsSync(pkgJsonPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!deps?.vitest) continue;

  const linkPath = join(pkgDir, "node_modules", "vitest");
  if (!existsSync(linkPath) && !existsSync(join(pkgDir, "node_modules", ".bin", "vitest"))) {
    errors.push(`${pkg.name}: vitest not installed under ${linkPath} — run pnpm install`);
    continue;
  }

  try {
    if (existsSync(linkPath) || lstatSync(linkPath)) {
      const real = realpathSync(linkPath);
      const entry = join(real, "vitest.mjs");
      const pkgEntry = join(real, "package.json");
      if (!existsSync(pkgEntry)) {
        errors.push(`${pkg.name}: broken vitest link → ${linkPath} (missing package.json). Run pnpm install.`);
      } else if (!existsSync(entry)) {
        // older layouts use dist/cli — package.json bin is enough if package resolves
        const meta = JSON.parse(readFileSync(pkgEntry, "utf8"));
        if (!meta.bin && !meta.exports) {
          errors.push(`${pkg.name}: vitest package at ${real} has no bin/exports`);
        }
      }
    }
  } catch {
    errors.push(
      `${pkg.name}: dangling vitest symlink at ${linkPath}. Run: pnpm install`
    );
  }
}

if (errors.length) {
  console.error("Workspace vitest install check failed:\n");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("");
  process.exit(1);
}

console.log("Workspace vitest bins OK");
