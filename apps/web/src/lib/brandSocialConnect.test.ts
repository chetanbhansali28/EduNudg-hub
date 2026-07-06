import { describe, expect, it } from "vitest";
import {
  buildBrandWhatsAppHref,
  hasBrandSocialFooterIcons,
  isBrandWhatsAppFloatVisible,
  migrateSocialConnectFromLanding,
  parseBrandSocialConnect,
} from "./brandSocialConnect";

describe("brandSocialConnect", () => {
  it("parseBrandSocialConnect reads social_connect from settings", () => {
    const connect = parseBrandSocialConnect({
      social_connect: {
        facebookUrl: "https://facebook.com/brand",
        instagramUrl: "https://instagram.com/brand",
        whatsappPhoneE164: "+919021924968",
        whatsappPrefillMessage: "Hello!",
        whatsappBubbleTitle: "Neha Patil (Mentor)",
        whatsappBubbleBody: "Let's coordinate a demo!",
      },
    });
    expect(connect.facebookUrl).toBe("https://facebook.com/brand");
    expect(connect.whatsappEnabled).toBe(true);
  });

  it("migrateSocialConnectFromLanding copies legacy footer social links", () => {
    const connect = parseBrandSocialConnect(
      {},
      {
        footer: {
          rich: {
            socialLinks: [
              { platform: "Facebook", url: "https://facebook.com/example" },
              { platform: "Instagram", url: "https://instagram.com/example" },
            ],
          },
        },
      } as never
    );
    expect(connect.facebookUrl).toBe("https://facebook.com/example");
    expect(connect.instagramUrl).toBe("https://instagram.com/example");
  });

  it("buildBrandWhatsAppHref includes encoded prefill message", () => {
    const href = buildBrandWhatsAppHref({
      whatsappPhoneE164: "+91 90219 24968",
      whatsappPrefillMessage: "Hello! I visited your website.",
      whatsappEnabled: true,
    });
    expect(href).toBe("https://wa.me/919021924968?text=Hello!%20I%20visited%20your%20website.");
  });

  it("hasBrandSocialFooterIcons and float visibility respect config", () => {
    expect(hasBrandSocialFooterIcons({ facebookUrl: "https://facebook.com/x" })).toBe(true);
    expect(
      isBrandWhatsAppFloatVisible({
        whatsappPhoneE164: "+919876543210",
        whatsappEnabled: true,
      })
    ).toBe(true);
    expect(
      isBrandWhatsAppFloatVisible({
        whatsappPhoneE164: "+919876543210",
        whatsappEnabled: false,
      })
    ).toBe(false);
  });
});
