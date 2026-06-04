import { describe, expect, it } from "vitest";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { mergePublishedSuccessStories } from "./mergeBrandTestimonials";

describe("mergePublishedSuccessStories", () => {
  it("keeps default testimonials when no published stories", () => {
    const base = DEFAULT_HOMEPAGE_CONFIG.testimonials;
    const result = mergePublishedSuccessStories(base, []);
    expect(result).toBe(base);
    expect(result.items.length).toBeGreaterThan(0);
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
  });
});
