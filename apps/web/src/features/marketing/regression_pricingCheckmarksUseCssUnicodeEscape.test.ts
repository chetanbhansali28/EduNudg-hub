import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("marketing CSS feature checkmarks", () => {
  const css = readFileSync(resolve(__dirname, "./marketing.css"), "utf8");

  it("regression_pricing_feature_checkmarks_use_css_unicode_escape", () => {
    expect(css).toMatch(/\.novu-pricing-card__features li::before\s*\{[^}]*content:\s*"\\2713"/s);
    expect(css).toMatch(/\.novu-enquiry-promo__perks li::before\s*\{[^}]*content:\s*"\\2713"/s);
    expect(css).toMatch(/\.ac-program-details__benefits-list li::before\s*\{[^}]*content:\s*"\\2713"/s);
    expect(css).not.toContain("\u00e2\u009c\u0093");
    expect(css).not.toMatch(/content:\s*"✓"/);
  });
});
