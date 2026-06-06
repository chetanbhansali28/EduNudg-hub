import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { locateSourceBabelPlugins, repoRoot } from "./viteLocateSource";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pluginModule = require("./babel-plugin-jsx-source-hints.cjs");

describe("locateSourceBabelPlugins", () => {
  it("regression_enables_jsx_source_hints_in_development", () => {
    const plugins = locateSourceBabelPlugins("development");
    expect(plugins).toHaveLength(1);
    expect(String(plugins[0]?.[0])).toMatch(/babel-plugin-jsx-source-hints\.cjs$/);
    expect(plugins[0]?.[1]).toEqual({
      enabled: true,
      rootDir: repoRoot,
    });
  });

  it("regression_disables_jsx_source_hints_outside_development", () => {
    expect(locateSourceBabelPlugins("production")).toEqual([]);
    expect(locateSourceBabelPlugins("test")).toEqual([]);
  });
});

describe("babel-plugin-jsx-source-hints", () => {
  it("regression_data_filepath_is_repo_relative", () => {
    const sampleFile = path.join(repoRoot, "apps/web/src/features/marketing/FeatureScrollSection.tsx");
    expect(pluginModule.toRepoPath(sampleFile, repoRoot)).toBe(
      "/apps/web/src/features/marketing/FeatureScrollSection.tsx"
    );
    expect(pluginModule.toRepoPath(sampleFile, repoRoot)).not.toContain("/Users/");
  });

  it("regression_supports_packages_ui_paths", () => {
    const uiFile = path.join(repoRoot, "packages/ui/src/components.tsx");
    expect(pluginModule.toRepoPath(uiFile, repoRoot)).toBe("/packages/ui/src/components.tsx");
  });
});
