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
    const sync = read(".cursor/rules/artifact-sync.mdc");
    const bounds = read(".cursor/rules/agent-boundaries.mdc");
    expect(sync).toMatch(/alwaysApply:\s*true/);
    expect(bounds).toMatch(/alwaysApply:\s*true/);
    expect(sync).toMatch(/edunudg-sync-artifacts/);
    expect(bounds).toMatch(/MUST NOT/);
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
    expect(dod).toMatch(/Artifact sync/);
    expect(dod).toMatch(/edunudg-sync-artifacts/);
  });
});
