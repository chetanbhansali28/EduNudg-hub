import { describe, expect, it } from "vitest";
import {
  hasCustomMarketingMedia,
  isBrandAssetsUrl,
  isStockMarketingUrl,
  mergeBrandSettingsPreserveContent,
  preserveCustomMarketingMediaUrls,
} from "./marketingMediaGuard";
import { buildBrandLandingConfig } from "./brandLandingDefaults";
import { buildCenterLandingConfig } from "./centerLandingDefaults";

/**
 * Regression: brand / franchise / platform marketing must never lose uploaded
 * brand-assets media when defaults, fallbacks, or editor saves intervene.
 */
describe("regression_tenantMarketingContentPreservesBrandAssets", () => {
  const asset = (path: string) =>
    `https://example.supabase.co/storage/v1/object/public/brand-assets/${path}`;
  const unsplash =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80";

  it("detects brand-assets vs stock urls", () => {
    expect(isBrandAssetsUrl(asset("x/logo.png"))).toBe(true);
    expect(isStockMarketingUrl(unsplash)).toBe(true);
    expect(isBrandAssetsUrl(unsplash)).toBe(false);
  });

  it("brand merge keeps uploaded hero media over theme unsplash defaults", () => {
    const partial = {
      hero: {
        backgroundImageUrl: asset("brand/marketing/hero-background/asset.jpeg"),
        phoneFrameUrl: asset("brand/marketing/hero-phone-frame/asset.png"),
      },
      meta: { logoUrl: asset("brand/logo.png") },
    };
    expect(hasCustomMarketingMedia(partial as never)).toBe(true);
    const merged = buildBrandLandingConfig("Abacus World", partial as never, asset("brand/logo.png"));
    expect(merged.hero.backgroundImageUrl).toContain("brand-assets");
    expect(merged.hero.backgroundImageUrl).not.toContain("unsplash.com");
  });

  it("center merge keeps uploaded media when partial is present", () => {
    const partial = {
      hero: {
        backgroundImageUrl: asset("brand/marketing/hero-background/asset.jpeg"),
      },
    };
    const merged = buildCenterLandingConfig(
      "Koramangala",
      "Abacus World",
      "Bengaluru",
      partial as never,
      null
    );
    expect(merged.hero.backgroundImageUrl).toContain("hero-background");
  });

  it("editor save does not replace brand-assets with unsplash stock", () => {
    const existing = {
      hero: { backgroundImageUrl: asset("brand/marketing/hero-background/asset.jpeg") },
      meta: { logoUrl: asset("brand/logo.png") },
    };
    const next = {
      hero: { backgroundImageUrl: unsplash, phoneFrameUrl: unsplash },
      meta: { logoUrl: unsplash, siteName: "X", fontSans: "Inter", fontSerif: "Serif" },
    };
    const preserved = preserveCustomMarketingMediaUrls(existing, next);
    expect(preserved.hero?.backgroundImageUrl).toContain("brand-assets");
    expect(preserved.meta?.logoUrl).toContain("brand-assets");
  });

  it("editor save does not replace about team photo brand-assets with unsplash stock", () => {
    const existing = {
      about: {
        imageUrl: asset("brand/marketing/about-story/asset.jpeg"),
        members: [{ photoUrl: asset("brand/marketing/about-member/asset.jpeg") }],
      },
    };
    const next = {
      about: {
        imageUrl: unsplash,
        members: [{ photoUrl: unsplash }],
        features: [],
      },
    };
    const preserved = preserveCustomMarketingMediaUrls(existing, next);
    expect(preserved.about?.imageUrl).toContain("brand-assets");
    expect(preserved.about?.members?.[0]?.photoUrl).toContain("brand-assets");
  });

  it("editor save does not replace about hero and philosophy brand-assets with unsplash stock", () => {
    const existing = {
      about: {
        heroImageUrl: asset("brand/marketing/about-hero/asset.jpeg"),
        philosophyImageUrl: asset("brand/marketing/about-philosophy/asset.jpeg"),
        features: [],
        members: [],
      },
    };
    const next = {
      about: {
        heroImageUrl: unsplash,
        philosophyImageUrl: unsplash,
        features: [],
        members: [],
      },
    };
    const preserved = preserveCustomMarketingMediaUrls(existing, next);
    expect(preserved.about?.heroImageUrl).toContain("brand-assets");
    expect(preserved.about?.philosophyImageUrl).toContain("brand-assets");
  });

  it("brand_settings merge prefers existing landing content", () => {
    const merged = mergeBrandSettingsPreserveContent(
      {
        timezone: "Asia/Kolkata",
        landing: { hero: { subtitle: "Custom subtitle", backgroundImageUrl: asset("a.jpeg") } },
      },
      {
        timezone: "UTC",
        landing: { hero: { subtitle: "Seed subtitle" } },
      }
    );
    expect((merged.landing as { hero: { subtitle: string } }).hero.subtitle).toBe("Custom subtitle");
    expect(merged.timezone).toBe("Asia/Kolkata");
  });
});
