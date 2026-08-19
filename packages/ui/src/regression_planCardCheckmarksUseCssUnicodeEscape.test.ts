import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("subscription plan card checkmarks", () => {
  const css = readFileSync(resolve(__dirname, "./styles.css"), "utf8");

  it("regression_plan_card_feature_checkmarks_use_css_unicode_escape", () => {
    expect(css).toMatch(/\.ed-plan-card__features li::before\s*\{[^}]*content:\s*"\\2713"/s);
    expect(css).not.toMatch(/\.ed-plan-card__features li::before\s*\{[^}]*content:\s*"✓"/s);
  });
});
