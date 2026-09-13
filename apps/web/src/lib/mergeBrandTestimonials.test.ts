import { describe, expect, it } from "vitest";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import {
  applyPublishedSuccessStoriesToPublicLanding,
  hasPublicTestimonials,
  mergePublishedSuccessStories,
} from "./mergeBrandTestimonials";

describe("mergePublishedSuccessStories", () => {
  it("regression_clears_dummy_testimonials_when_no_published_stories", () => {
    const base = DEFAULT_HOMEPAGE_CONFIG.testimonials;
    const result = mergePublishedSuccessStories(base, []);
    expect(result.title).toBe(base.title);
    expect(result.items).toEqual([]);
    expect(hasPublicTestimonials(result)).toBe(false);
  });

  it("replaces items with published stories from DB", () => {
    const base = DEFAULT_HOMEPAGE_CONFIG.testimonials;
    const result = mergePublishedSuccessStories(base, [
      { quote: "My child loves abacus!", author: "Priya · Parent" },
      { quote: "Best franchise decision.", author: "Raj · Franchise Owner" },
    ]);
    expect(result.title).toBe(base.title);
    expect(result.subtitle).toBe(base.subtitle);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.quote).toBe("My child loves abacus!");
    expect(result.items[0]?.author).toBe("Priya · Parent");
    expect(hasPublicTestimonials(result)).toBe(true);
  });
});

describe("applyPublishedSuccessStoriesToPublicLanding", () => {
  it("regression_hides_testimonials_section_and_nav_when_brand_has_no_stories", () => {
    const withTestimonialsNav = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      nav: {
        ...DEFAULT_HOMEPAGE_CONFIG.nav,
        links: [
          ...DEFAULT_HOMEPAGE_CONFIG.nav.links,
          { label: "Success stories", href: "#testimonials" },
        ],
      },
    };
    const result = applyPublishedSuccessStoriesToPublicLanding(withTestimonialsNav, []);
    expect(result.testimonials.items).toEqual([]);
    expect(result.sections?.testimonials).toBe(false);
    expect(result.nav.links.some((link) => link.href === "#testimonials")).toBe(false);
  });

  it("regression_shows_brand_success_stories_on_public_landing", () => {
    const result = applyPublishedSuccessStoriesToPublicLanding(DEFAULT_HOMEPAGE_CONFIG, [
      { quote: "Great support.", author: "Priya · Owner", title: "Parent" },
    ]);
    expect(result.testimonials.items).toEqual([
      { quote: "Great support.", author: "Priya · Owner", role: "Parent" },
    ]);
    expect(result.sections?.testimonials).toBe(true);
  });
});
