import { describe, expect, it } from "vitest";
import { buildCenterLandingConfig } from "./centerLandingDefaults";
import { mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";
import { sanitizeCenterPublicNavConfig } from "./centerPublicNav";

describe("sanitizeCenterPublicNavConfig", () => {
  it("removes Enroll from main nav links while keeping Book a free trial CTA", () => {
    const config = buildCenterLandingConfig("Koramangala Center", "Abacus World", "Bengaluru");
    const withLegacyEnroll = {
      ...config,
      nav: {
        ...config.nav,
        links: [...config.nav.links, { label: "Enroll", href: "#enroll" }],
      },
    };

    const sanitized = sanitizeCenterPublicNavConfig(withLegacyEnroll);

    expect(sanitized.nav.links.some((l) => l.label.toLowerCase() === "enroll")).toBe(false);
    expect(sanitized.nav.ctaLabel).toBe("Book a free trial");
    expect(sanitized.nav.ctaHref).toBe("#enroll");
  });

  it("regression_centerPublicNavOmitsFranchiseApplyCta", () => {
    const brandLike = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const leaked = {
      ...brandLike,
      nav: {
        ...brandLike.nav,
        links: [
          ...brandLike.nav.links,
          { label: "Apply franchise", href: "apply" },
          { label: "Contact", href: "#apply" },
        ],
        ctaLabel: "Book a free trial",
        ctaHref: "#enroll",
      },
    };

    const sanitized = sanitizeCenterPublicNavConfig(leaked);

    expect(sanitized.nav.secondaryCtaLabel).toBeUndefined();
    expect(sanitized.nav.secondaryCtaHref).toBeUndefined();
    expect(sanitized.hero.secondaryCtaLabel).toBeUndefined();
    expect(sanitized.hero.secondaryCtaHref).toBeUndefined();
    expect(sanitized.nav.links.some((l) => /franchise|apply/i.test(l.label))).toBe(false);
    expect(sanitized.nav.links.some((l) => /apply/i.test(l.href))).toBe(false);
  });
});
