import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exactAccessibleName } from "./exactAccessibleName";

describe("exactAccessibleName", () => {
  it("anchors the full accessible name", () => {
    const re = exactAccessibleName("Log in");
    expect(re.test("Log in")).toBe(true);
    expect(re.test("Log in with Google")).toBe(false);
    expect(re.test("Signing in…")).toBe(false);
  });
});

/**
 * Regression: Testing Library ByRoleOptions has no `exact` — CI typecheck fails
 * if Vitest/RTL queries pass `{ exact: true }` (Playwright-only option).
 */
describe("regression_testingLibrary_byRole_no_exact_option", () => {
  it("apps/web Vitest sources do not pass exact to getByRole/queryByRole/findByRole", () => {
    const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(test|spec)\.(ts|tsx)$/.test(name)) continue;
        const text = readFileSync(full, "utf8");
        // Playwright lives under e2e/ — only flag Testing Library screen/within queries
        if (
          /\b(?:screen|within\([^)]+\))\.(?:get|query|find)(?:All)?ByRole\([^)]*\{[^}]*\bexact\s*:/.test(
            text
          ) ||
          /\b(?:get|query|find)(?:All)?ByRole\(\s*["'][^"']+["']\s*,\s*\{[^}]*\bexact\s*:/.test(text)
        ) {
          offenders.push(path.relative(srcRoot, full));
        }
      }
    }

    walk(srcRoot);
    expect(offenders, `Use exactAccessibleName("…") or /^…$/ — not exact: true:\n${offenders.join("\n")}`).toEqual(
      []
    );
  });
});
