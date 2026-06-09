import { describe, expect, it } from "vitest";
import { MARKETING_THEMES, parseMarketingTheme } from "./homepage";

describe("parseMarketingTheme", () => {
  it("returns abacus-classic for valid theme value", () => {
    expect(parseMarketingTheme("abacus-classic")).toBe("abacus-classic");
  });

  it("returns spark-academy for valid theme value", () => {
    expect(parseMarketingTheme("spark-academy")).toBe("spark-academy");
  });

  it("defaults unknown values to novu", () => {
    expect(parseMarketingTheme("novu")).toBe("novu");
    expect(parseMarketingTheme(null)).toBe("novu");
    expect(parseMarketingTheme(undefined)).toBe("novu");
    expect(parseMarketingTheme("invalid")).toBe("novu");
    expect(parseMarketingTheme("")).toBe("novu");
  });

  it("exports all marketing themes", () => {
    expect(MARKETING_THEMES).toEqual(["novu", "abacus-classic", "spark-academy"]);
  });
});
