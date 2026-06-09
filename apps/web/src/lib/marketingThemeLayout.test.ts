import { describe, expect, it } from "vitest";
import {
  marketingPageClassName,
  themeUsesLeadModals,
  isAlternateMarketingTheme,
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
});
