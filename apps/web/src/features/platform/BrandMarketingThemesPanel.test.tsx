import { describe, expect, it } from "vitest";
import { marketingThemeSelectOptions } from "./BrandMarketingThemesPanel";
import { MARKETING_THEMES } from "@/types/homepage";

describe("marketingThemeSelectOptions", () => {
  it("regression_includes_all_marketing_themes", () => {
    const options = marketingThemeSelectOptions();
    expect(options).toHaveLength(MARKETING_THEMES.length);
    expect(options.map((option) => option.value)).toEqual(MARKETING_THEMES);
    expect(options.every((option) => option.label.length > 0)).toBe(true);
  });
});
