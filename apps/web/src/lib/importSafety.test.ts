import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findDuplicateNamedImports } from "./importSafety";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("importSafety", () => {
  it("findDuplicateNamedImports detects repeated specifiers", () => {
    const source = `import { foo, bar, foo } from "x";`;
    expect(findDuplicateNamedImports(source)).toEqual(["foo"]);
  });

  it("regression_no_duplicate_named_imports_in_web_src", () => {
    const offenders: { file: string; duplicates: string[] }[] = [];

    for (const file of collectSourceFiles(srcRoot)) {
      const duplicates = findDuplicateNamedImports(readFileSync(file, "utf8"));
      if (duplicates.length > 0) {
        offenders.push({ file: path.relative(srcRoot, file), duplicates });
      }
    }

    expect(offenders).toEqual([]);
  });

  it("regression_web_app_typechecks", () => {
    const webRoot = path.resolve(srcRoot, "..");
    execSync("pnpm run typecheck", { cwd: webRoot, stdio: "pipe" });
  }, 120_000);
});
