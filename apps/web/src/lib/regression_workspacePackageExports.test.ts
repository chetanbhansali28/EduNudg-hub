import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createSupabaseClient } from "@edunudg/database";
import { resolveTenantFromHost } from "@edunudg/tenant";

/**
 * Regression: CI typecheck failed when @edunudg/* packages pointed at missing dist/
 * while `pnpm build` only built apps/web. Keep source exports + tsconfig paths in sync
 * with Vite aliases so `tsc --noEmit` works without a prior package build.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const WORKSPACE_PACKAGES = [
  "packages/ui",
  "packages/tenant",
  "packages/permissions",
  "packages/database",
] as const;

function collectExportPaths(exportsField: unknown): string[] {
  if (typeof exportsField === "string") return [exportsField];
  if (!exportsField || typeof exportsField !== "object") return [];
  const out: string[] = [];
  for (const value of Object.values(exportsField as Record<string, unknown>)) {
    if (typeof value === "string") out.push(value);
    else if (value && typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (typeof nested === "string") out.push(nested);
      }
    }
  }
  return out;
}

describe("regression_workspacePackageExports", () => {
  it("package types/main/exports resolve to existing source files (no dist build required)", () => {
    for (const rel of WORKSPACE_PACKAGES) {
      const pkgDir = path.join(repoRoot, rel);
      const pkg = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8")) as {
        main?: string;
        types?: string;
        exports?: unknown;
      };

      const targets = [pkg.types, pkg.main, ...collectExportPaths(pkg.exports)].filter(
        (t): t is string => typeof t === "string" && !t.endsWith(".css")
      );

      expect(targets.length, `${rel} should declare export targets`).toBeGreaterThan(0);

      for (const target of targets) {
        const abs = path.resolve(pkgDir, target);
        expect(existsSync(abs), `${rel} missing export target: ${target}`).toBe(true);
        expect(
          target.includes("/src/") || target.startsWith("./src/"),
          `${rel} must export TypeScript source for apps/web typecheck (got ${target})`
        ).toBe(true);
      }
    }
  });

  it("apps/web tsconfig paths mirror Vite workspace aliases", () => {
    const tsconfig = JSON.parse(
      readFileSync(path.join(repoRoot, "apps/web/tsconfig.json"), "utf8")
    ) as { compilerOptions: { paths: Record<string, string[]> } };
    const { paths } = tsconfig.compilerOptions;

    for (const name of ["@edunudg/ui", "@edunudg/tenant", "@edunudg/permissions", "@edunudg/database"]) {
      expect(paths[name]?.length, `missing tsconfig paths for ${name}`).toBeGreaterThan(0);
      const mapped = paths[name]![0]!;
      const abs = path.resolve(path.join(repoRoot, "apps/web"), mapped);
      expect(existsSync(abs), `${name} path ${mapped} does not exist`).toBe(true);
    }
  });

  it("workspace packages are importable from apps/web", () => {
    expect(typeof createSupabaseClient).toBe("function");
    expect(typeof resolveTenantFromHost).toBe("function");
  });
});
