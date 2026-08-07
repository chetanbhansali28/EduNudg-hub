#!/usr/bin/env node
/**
 * Installs repo git hooks into .git/hooks (no git config changes).
 * Invoked from package.json "prepare" after pnpm install.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gitDir = join(root, ".git");
const hooksSrcDir = join(root, ".githooks");
const hooksDestDir = join(gitDir, "hooks");

if (!existsSync(gitDir)) {
  console.log("install-git-hooks: no .git directory — skip");
  process.exit(0);
}

mkdirSync(hooksDestDir, { recursive: true });

const hooks = ["pre-push"];
for (const name of hooks) {
  const src = join(hooksSrcDir, name);
  const dest = join(hooksDestDir, name);
  if (!existsSync(src)) {
    console.warn(`install-git-hooks: missing ${src}`);
    continue;
  }
  copyFileSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`install-git-hooks: installed ${name}`);
}
