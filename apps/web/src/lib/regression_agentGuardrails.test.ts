import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Regression: agent orchestration guardrails must stay present so specs, docs,
 * skills, agents, and boundaries remain discoverable and in sync.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(repoRoot, rel));
}

describe("regression_agentGuardrails", () => {
  it("always-apply sync and boundary rules exist", () => {
    expect(exists(".cursor/rules/artifact-sync.mdc")).toBe(true);
    expect(exists(".cursor/rules/agent-boundaries.mdc")).toBe(true);
    expect(exists(".cursor/rules/git-publish-gate.mdc")).toBe(true);
    const sync = read(".cursor/rules/artifact-sync.mdc");
    const bounds = read(".cursor/rules/agent-boundaries.mdc");
    const git = read(".cursor/rules/git-publish-gate.mdc");
    expect(sync).toMatch(/alwaysApply:\s*true/);
    expect(bounds).toMatch(/alwaysApply:\s*true/);
    expect(git).toMatch(/alwaysApply:\s*true/);
    expect(sync).toMatch(/edunudg-sync-artifacts/);
    expect(bounds).toMatch(/MUST NOT/);
    expect(bounds).toMatch(/git-publish-gate/);
    expect(git).toMatch(/git push/i);
    expect(git).toMatch(/explicitly/i);
  });

  it("sync skill and OpenSpec capability exist", () => {
    expect(exists(".cursor/skills/edunudg-sync-artifacts/SKILL.md")).toBe(true);
    expect(exists("openspec/specs/agent-artifact-sync/spec.md")).toBe(true);
    expect(read("openspec/specs/agent-artifact-sync/spec.md")).toMatch(/Sync surface is mandatory/);
  });

  it("agent briefs declare hard boundaries", () => {
    for (const agent of ["architect", "database", "frontend", "qa"]) {
      const body = read(`.cursor/agents/${agent}.md`);
      expect(body, agent).toMatch(/Boundary \(hard\)/);
      expect(body, agent).toMatch(/MUST NOT/);
      expect(body, agent).toMatch(/edunudg-sync-artifacts/);
    }
  });

  it("AGENTS.md and DoD require artifact sync", () => {
    const agents = read("AGENTS.md");
    const dod = read("docs/agent-playbook/definition-of-done.md");
    expect(agents).toMatch(/edunudg-sync-artifacts/);
    expect(agents).toMatch(/agent-boundaries/);
    expect(agents).toMatch(/git-publish-gate/);
    expect(agents).toMatch(/Never.*git push|git push/i);
    expect(dod).toMatch(/Artifact sync/);
    expect(dod).toMatch(/edunudg-sync-artifacts/);
    expect(dod).toMatch(/git-publish-gate/);
  });

  it("sync skill forbids push without explicit user request", () => {
    const skill = read(".cursor/skills/edunudg-sync-artifacts/SKILL.md");
    expect(skill).toMatch(/git-publish-gate|git push/i);
    expect(skill).toMatch(/explicitly/i);
  });

  it("pre-push CI skill and script mirror GitHub CI", () => {
    expect(exists(".cursor/skills/edunudg-pre-push-ci/SKILL.md")).toBe(true);
    expect(exists("scripts/ci-local.mjs")).toBe(true);
    const skill = read(".cursor/skills/edunudg-pre-push-ci/SKILL.md");
    const gate = read(".cursor/rules/git-publish-gate.mdc");
    const pkg = read("package.json");
    expect(skill).toMatch(/pnpm ci:local/);
    expect(skill).toMatch(/Automatically fix|auto-fix/i);
    expect(gate).toMatch(/edunudg-pre-push-ci/);
    expect(gate).toMatch(/ci:local/);
    expect(pkg).toMatch(/"ci:local"/);
    const script = read("scripts/ci-local.mjs");
    expect(script).toMatch(/audit:schema/);
    expect(script).toMatch(/typecheck/);
    expect(script).toMatch(/test:rls/);
    expect(script).toMatch(/test:e2e/);
  });
});
