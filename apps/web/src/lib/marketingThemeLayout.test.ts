import { describe, expect, it } from "vitest";
import {
  marketingPageClassName,
  themeUsesLeadModals,
  isAlternateMarketingTheme,
  aboutUsThemeClass,
} from "@/lib/marketingThemeLayout";

describe("marketingThemeLayout", () => {
  it("returns spark academy page class", () => {
    expect(marketingPageClassName("spark-academy")).toBe("marketing-page marketing-page--spark-academy");
  });

  it("spark academy uses lead modals", () => {
    expect(themeUsesLeadModals("spark-academy")).toBe(true);
    expect(themeUsesLeadModals("novu")).toBe(false);
  });

  it("detects alternate themes", () => {
    expect(isAlternateMarketingTheme("spark-academy")).toBe(true);
    expect(isAlternateMarketingTheme("novu")).toBe(false);
  });

  it("regression_about_us_theme_class_matches_brand_theme", () => {
    expect(aboutUsThemeClass("spark-academy")).toBe("about-us--spark-academy");
    expect(aboutUsThemeClass("abacus-classic")).toBe("about-us--abacus-classic");
    expect(aboutUsThemeClass("novu")).toBe("about-us--novu");
    expect(aboutUsThemeClass(undefined)).toBe("about-us--novu");
  });
});
