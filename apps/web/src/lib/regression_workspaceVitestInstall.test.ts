import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Regression: broken pnpm links left packages/tenant|permissions unable to run
 * `vitest` (`Cannot find module .../vitest/vitest.mjs`). Guard install integrity.
 */
describe("regression_workspaceVitestInstall", () => {
  it("packages that declare vitest have a resolvable install (not a dangling symlink)", () => {
    const packagesDir = path.join(repoRoot, "packages");
    const withVitest: string[] = [];

    for (const name of readdirSync(packagesDir)) {
      const pkgJsonPath = path.join(packagesDir, name, "package.json");
      if (!existsSync(pkgJsonPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
        name?: string;
        devDependencies?: Record<string, string>;
        dependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!deps.vitest) continue;
      withVitest.push(pkg.name ?? name);

      const linkPath = path.join(packagesDir, name, "node_modules", "vitest");
      let stat;
      try {
        stat = lstatSync(linkPath);
      } catch {
        expect.fail(`${name}: missing vitest at ${linkPath} — run pnpm install`);
        return;
      }
      expect(stat.isSymbolicLink() || stat.isDirectory()).toBe(true);

      let real: string;
      try {
        real = realpathSync(linkPath);
      } catch {
        expect.fail(`${name}: dangling vitest symlink at ${linkPath} — run pnpm install`);
        return;
      }
      expect(existsSync(path.join(real, "package.json")), `${name}: vitest package incomplete at ${real}`).toBe(
        true
      );
    }

    expect(withVitest.length).toBeGreaterThan(0);
    expect(withVitest).toEqual(expect.arrayContaining(["@edunudg/tenant", "@edunudg/permissions"]));
  });

  it("root test script asserts workspace vitest bins before recursive test", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.test).toMatch(/assert-workspace-test-bins/);
    expect(existsSync(path.join(repoRoot, "scripts/assert-workspace-test-bins.mjs"))).toBe(true);
  });
});
