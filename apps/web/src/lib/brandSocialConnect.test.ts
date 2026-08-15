import { describe, expect, it } from "vitest";
import {
  hasBrandSocialFooterIcons,
  migrateSocialConnectFromLanding,
  parseBrandSocialConnect,
  socialConnectFromCenterLinks,
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
    expect(connect.instagramUrl).toBe("https://instagram.com/brand");
    expect(connect.whatsappPhoneE164).toBe("+919021924968");
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
              { platform: "WhatsApp", url: "https://wa.me/919876543210" },
            ],
          },
        },
      } as never
    );
    expect(connect.facebookUrl).toBe("https://facebook.com/example");
    expect(connect.instagramUrl).toBe("https://instagram.com/example");
    expect(connect.whatsappPhoneE164).toBeUndefined();
  });

  it("hasBrandSocialFooterIcons respects facebook and instagram only", () => {
    expect(hasBrandSocialFooterIcons({ facebookUrl: "https://facebook.com/x" })).toBe(true);
    expect(hasBrandSocialFooterIcons({ instagramUrl: "https://instagram.com/x" })).toBe(true);
    expect(hasBrandSocialFooterIcons({ whatsappPhoneE164: "+919876543210", whatsappEnabled: true })).toBe(
      false
    );
  });

  it("regression_center_footer_uses_franchise_social_not_brand", () => {
    const connect = socialConnectFromCenterLinks([
      { platform: "Facebook", url: "https://facebook.com/koramangala-center" },
      { platform: "Instagram", url: "https://instagram.com/koramangala-center" },
    ]);
    expect(connect.facebookUrl).toBe("https://facebook.com/koramangala-center");
    expect(connect.instagramUrl).toBe("https://instagram.com/koramangala-center");
  });
});
