import { describe, expect, it } from "vitest";
import { hasConfiguredMarketingLanding } from "./marketingLandingContent";

describe("hasConfiguredMarketingLanding", () => {
  it("regression_empty_or_seed_subtitle_is_not_configured_landing", () => {
    expect(hasConfiguredMarketingLanding(null)).toBe(false);
    expect(hasConfiguredMarketingLanding({})).toBe(false);
    expect(
      hasConfiguredMarketingLanding({
        hero: { subtitle: "Train young minds with a proven abacus program." },
      })
    ).toBe(false);
  });

  it("regression_saved_homepage_or_center_site_counts_as_configured", () => {
    expect(hasConfiguredMarketingLanding({ hero: { line1: "Give your child" } })).toBe(true);
    expect(
      hasConfiguredMarketingLanding({
        hero: {
          backgroundImageUrl:
            "https://xyz.supabase.co/storage/v1/object/public/brand-assets/brand/marketing/hero-background/asset.jpeg",
        },
      })
    ).toBe(true);
    expect(
      hasConfiguredMarketingLanding({
        meta: { logoUrl: "https://xyz.supabase.co/storage/v1/object/public/brand-assets/logo.png" },
      })
    ).toBe(true);
    expect(hasConfiguredMarketingLanding({ faq: [{ question: "What age?", answer: "4–14" }] })).toBe(true);
    expect(hasConfiguredMarketingLanding({ founders: [{ name: "Founder name" }] })).toBe(false);
    expect(hasConfiguredMarketingLanding({ founders: [{ name: "Chetan Bhansali" }] })).toBe(true);
  });
});
