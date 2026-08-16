import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CURRICULUM_SPLIT = /grid-template-columns:\s*minmax\(16rem,\s*0\.95fr\)\s+minmax\(0,\s*2\.05fr\)/;

describe("center merchandise workspace split", () => {
  it("regression_center_merchandise_list_column_matches_curriculum_width", () => {
    const merchCss = readFileSync(resolve(__dirname, "merchandiseShop.css"), "utf8");
    const curriculumCss = readFileSync(
      resolve(__dirname, "../../brand/curriculum/curriculumBrand.css"),
      "utf8",
    );

    expect(curriculumCss).toMatch(CURRICULUM_SPLIT);
    expect(merchCss).toMatch(
      /@media \(min-width: 1024px\)\s*\{\s*\.ed-center-merch-page\s+\.ed-pipeline-workspace\s*\{[^}]*grid-template-columns:\s*minmax\(16rem,\s*0\.95fr\)\s+minmax\(0,\s*2\.05fr\)/s,
    );
    expect(merchCss).not.toMatch(/minmax\(0,\s*1fr\)\s+20rem/);
  });

  it("regression_center_merchandise_shop_actions_stack_full_width_add", () => {
    const uiCss = readFileSync(
      resolve(__dirname, "../../../../../../packages/ui/src/styles.css"),
      "utf8",
    );
    const merchCss = readFileSync(resolve(__dirname, "merchandiseShop.css"), "utf8");

    expect(uiCss).toMatch(
      /\.ed-product-card--row \.ed-product-card__actions\s*\{[^}]*flex-direction:\s*column/s,
    );
    expect(uiCss).toMatch(
      /\.ed-product-card--row \.ed-product-card__actions \.ed-btn\s*\{[^}]*width:\s*100%/s,
    );
    expect(uiCss).not.toMatch(
      /\.ed-product-card--row \.ed-product-card__actions \.ed-btn\s*\{[^}]*min-width:\s*max-content/s,
    );
    expect(merchCss).not.toMatch(/min-width:\s*max-content/);
  });
});
