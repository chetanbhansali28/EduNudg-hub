import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public nav logo lockup", () => {
  const marketingCss = readFileSync(resolve(__dirname, "./marketing.css"), "utf8");
  const sparkCss = readFileSync(resolve(__dirname, "./spark-academy/spark-academy.css"), "utf8");

  it("regression_public_nav_logo_matches_franchise_size_without_border", () => {
    expect(marketingCss).toMatch(/\.ac-nav__logo-img,\s*\n\.ac-nav__logo-fallback \{\s*\n\s*width:\s*3\.75rem;/);
    expect(marketingCss).toMatch(/\.novu-nav-bar__logo-img \{\s*\n\s*width:\s*3\.5rem;/);
    expect(sparkCss).toMatch(/\.sa-nav__logo-img,\s*\n\.sa-nav__logo-fallback \{\s*\n\s*width:\s*3\.75rem;/);

    expect(marketingCss).not.toMatch(/box-shadow:\s*0 0 0 2px #fff,\s*0 0 0 4px var\(--ac-orange\)/);
    expect(sparkCss).not.toMatch(/box-shadow:\s*0 0 0 2px #fff,\s*0 0 0 4px var\(--sa-blue\)/);
    expect(marketingCss).toMatch(/\.ac-nav__logo-img[\s\S]*?box-shadow:\s*none/);
    expect(marketingCss).toMatch(/\.novu-nav-bar__logo-img[\s\S]*?border:\s*none/);
    expect(sparkCss).toMatch(/\.sa-nav__logo-img[\s\S]*?box-shadow:\s*none/);
  });
});
