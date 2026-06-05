import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig } from "./brandLandingDefaults";
import { landingConfigToPartial } from "./brandLandingEditorApi";

describe("landingConfigToPartial", () => {
  it("serializes editable homepage sections for brand_settings", () => {
    const config = buildBrandLandingConfig("Abacus World");
    config.hero.line1 = "Custom hero";
    config.faq.push({ question: "New?", answer: "Yes." });

    const partial = landingConfigToPartial(config);

    expect(partial.hero?.line1).toBe("Custom hero");
    expect(partial.meta?.siteName).toBe("Abacus World");
    expect(partial.faq).toHaveLength(config.faq.length);
    expect(partial.featureSections?.length).toBeGreaterThan(0);
    expect(partial.testimonials?.title).toBeTruthy();
  });

  it("regression_brand_landing_partial_includes_nav_links", () => {
    const config = buildBrandLandingConfig("Demo Brand");
    config.nav.links.push({ label: "Pricing", href: "#pricing" });
    const partial = landingConfigToPartial(config);
    expect(partial.nav?.links?.some((l) => l.label === "Pricing")).toBe(true);
  });
});
