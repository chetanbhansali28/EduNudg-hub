import { describe, expect, it } from "vitest";
import {
  hasCustomPlatformMarketingMedia,
  isLegacyPlatformHomepageSeed,
  mergeHomepageConfig,
} from "./homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "./homepageDefaults";

/**
 * Regression: customized platform homepage rows with Storage media must never be
 * thrown away for Novu theme markers (bgGradient / themeNote). That bug made
 * `/` and `/admin/homepage` look “reset” while files remained in brand-assets.
 */
describe("regression_homepageLegacySeedKeepsBrandAssets", () => {
  const asset = (path: string) =>
    `https://example.supabase.co/storage/v1/object/public/brand-assets/${path}`;

  const customizedWithNovuMarkers = {
    theme: { bgGradient: "linear-gradient(180deg, #f7f3ec, #e8dfd0)" } as never,
    meta: {
      siteName: "EduNudg",
      fontSans: "Inter",
      fontSerif: "Playfair Display",
      themeNote: "Novu-inspired glassmorphism",
      logoUrl: asset("platform-logo.png"),
    },
    hero: {
      line1: "Launch & Scale",
      backgroundImageUrl: asset("platform/marketing/hero-background/asset.jpeg"),
      phoneFrameUrl: asset("platform/marketing/hero-phone-frame/asset.png"),
    },
    heroOverlayCard: { eyebrow: "Global sync", value: "Active", progressPercent: 72 },
    ecosystemIntro: { title: "Connected", subtitle: "Ecosystem" },
    connectivityShowcase: {
      title: "Showcase",
      subtitle: "Subtitle",
      centerImageUrl: asset("platform/marketing/connectivity-center/asset.jpg"),
      cards: [],
    },
    brandSignup: {
      title: "Launch",
      subtitle: "Free",
      promoImageUrl: asset("platform/marketing/brand-signup-promo/asset.png"),
      steps: [],
    },
    footerCta: {
      title: "Footer",
      subtitle: "CTA",
      ctaLabel: "Launch",
      ctaHref: "#brand-signup",
      backgroundImageUrl: asset("platform/marketing/footer-background/asset.png"),
    },
  };

  it("detects brand-assets URLs as custom media", () => {
    expect(hasCustomPlatformMarketingMedia(customizedWithNovuMarkers as never)).toBe(true);
    expect(hasCustomPlatformMarketingMedia(DEFAULT_HOMEPAGE_CONFIG)).toBe(false);
  });

  it("does not classify customized Novu-marked rows as legacy seed", () => {
    expect(isLegacyPlatformHomepageSeed(customizedWithNovuMarkers as never)).toBe(false);
  });

  it("merge keeps uploaded media instead of Unsplash defaults", () => {
    const merged = mergeHomepageConfig(customizedWithNovuMarkers as never);
    expect(merged.hero.backgroundImageUrl).toContain("brand-assets/platform/marketing/hero-background");
    expect(merged.meta.logoUrl).toContain("brand-assets/platform-logo");
    expect(merged.connectivityShowcase?.centerImageUrl).toContain("connectivity-center");
    expect(merged.brandSignup?.promoImageUrl).toContain("brand-signup-promo");
    expect(merged.footerCta.backgroundImageUrl).toContain("footer-background");
    expect(merged.hero.backgroundImageUrl).not.toContain("unsplash.com");
  });

  it("still treats virgin Novu seed without media as legacy", () => {
    expect(
      isLegacyPlatformHomepageSeed({
        theme: { bgGradient: "linear-gradient(#fff,#eee)" } as never,
        meta: {
          siteName: "EduNudg",
          fontSans: "Inter",
          fontSerif: "Playfair Display",
          themeNote: "Novu-inspired",
        },
        hero: { line1: "Hello" } as never,
      })
    ).toBe(true);
  });
});
