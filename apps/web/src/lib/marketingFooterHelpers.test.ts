import { describe, expect, it } from "vitest";
import { buildBrandFooterStats, parsePresenceCitiesInput, resolveFooterLegalHref } from "@/lib/marketingFooterHelpers";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";

describe("marketingFooterHelpers", () => {
  it("buildBrandFooterStats uses manual brandStats and custom stats", () => {
    const stats = buildBrandFooterStats({
      brandStats: { franchiseCount: "12+", studentCount: "5k+" },
      customStats: [{ value: "100+", label: "Awards" }],
    });
    expect(stats.map((s) => s.label)).toEqual(["Franchises", "Students", "Awards"]);
  });

  it("regression_footer_manual_stats_not_live_db", () => {
    const config = mergeAbacusClassicLandingConfig("Test Brand");
    config.footer.rich = {
      brandStats: { franchiseCount: "9+", studentCount: "1k+" },
    };
    const stats = buildBrandFooterStats(config.footer.rich);
    expect(stats).toEqual([
      { value: "9+", label: "Franchises" },
      { value: "1k+", label: "Students" },
    ]);
  });

  it("resolveFooterLegalHref returns route only when document is published", () => {
    const config = mergeAbacusClassicLandingConfig("Test");
    expect(resolveFooterLegalHref("privacy", config, {})).toBeNull();
    expect(
      resolveFooterLegalHref("privacy", config, {
        privacy: {
          fileName: "privacy.pdf",
          fileUrl: "https://example.com/privacy.pdf",
          mimeType: "application/pdf",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      })
    ).toBe("/legal/privacy");
  });

  it("parsePresenceCitiesInput splits comma-separated cities", () => {
    expect(parsePresenceCitiesInput("Pune, Satara , Sangli")).toEqual(["Pune", "Satara", "Sangli"]);
  });
});
