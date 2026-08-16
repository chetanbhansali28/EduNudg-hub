import { describe, expect, it } from "vitest";
import {
  formatSettingsUpdated,
  normalizeStaleLeadDays,
  previewBrandLoginCopy,
  siteLogoFromBrandSettings,
} from "./brandSettingsHelpers";

describe("brandSettingsHelpers", () => {
  it("formats settings updated label", () => {
    const now = new Date("2026-06-22T12:00:00Z").getTime();
    expect(formatSettingsUpdated("2026-06-22T10:00:00Z", now)).toBe("Last updated 2 hours ago by Admin");
  });

  it("previewBrandLoginCopy uses draft headline and falls back when blank", () => {
    const custom = previewBrandLoginCopy("Smart Brain Abacus", "Welcome parents", "Sign in for class updates.");
    expect(custom.headline).toBe("Welcome parents");
    expect(custom.subtext).toBe("Sign in for class updates.");
    const fallback = previewBrandLoginCopy("Smart Brain Abacus", "", "");
    expect(fallback.headline).toContain("Smart Brain Abacus");
    expect(fallback.subtext).toContain("franchise");
    const withLogo = previewBrandLoginCopy("Smart Brain Abacus", "Hi", "There", "https://cdn.example/logo.png");
    expect(withLogo.logoUrl).toBe("https://cdn.example/logo.png");
  });

  it("siteLogoFromBrandSettings reads homepage landing.meta.logoUrl", () => {
    expect(siteLogoFromBrandSettings(undefined)).toBeNull();
    expect(siteLogoFromBrandSettings({ landing: { meta: { logoUrl: "  https://cdn.example/site.png  " } } })).toBe(
      "https://cdn.example/site.png"
    );
  });
});
