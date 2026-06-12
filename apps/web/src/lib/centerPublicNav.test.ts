import { describe, expect, it } from "vitest";
import { buildCenterLandingConfig } from "./centerLandingDefaults";
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
});
