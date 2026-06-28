import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { setSectionEnabled } from "@/lib/homepageSections";
import { EnterprisePlatformContent } from "./EnterprisePlatformContent";

vi.mock("../useScrollReveal", () => ({
  useScrollReveal: vi.fn(),
}));

vi.mock("../PlatformPricingSection", () => ({
  PlatformPricingSection: () => null,
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegration: () => true,
}));

vi.mock("@/lib/platformBrandSignupApi", () => ({
  submitPlatformBrandSignup: vi.fn(),
}));

describe("EnterprisePlatformContent", () => {
  it("regression_renders_enterprise_hero_and_feature_sections", () => {
    render(<EnterprisePlatformContent config={DEFAULT_HOMEPAGE_CONFIG} />);
    expect(screen.getByText(/Learn with/i)).toBeDefined();
    expect(screen.getByText(/clarity\./i)).toBeDefined();
    expect(document.getElementById("features")).toBeTruthy();
    expect(document.getElementById("connectivity")).toBeTruthy();
    expect(document.getElementById("brand-signup")).toBeTruthy();
  });

  it("regression_omits_novu_phone_scroll_sections", () => {
    render(<EnterprisePlatformContent config={DEFAULT_HOMEPAGE_CONFIG} />);
    expect(document.querySelector(".novu-features-stack")).toBeNull();
    expect(document.querySelector(".novu-highlights")).toBeNull();
  });

  it("regression_shows_faq_when_enabled", () => {
    render(<EnterprisePlatformContent config={DEFAULT_HOMEPAGE_CONFIG} />);
    expect(document.getElementById("faq")).toBeTruthy();
    expect(document.getElementById("privacy")).toBeNull();
  });

  it("regression_never_renders_privacy_on_platform", () => {
    const config = setSectionEnabled(DEFAULT_HOMEPAGE_CONFIG, "privacy", true);
    render(<EnterprisePlatformContent config={config} />);
    expect(document.getElementById("privacy")).toBeNull();
  });

  it("regression_never_renders_testimonials_on_platform", () => {
    const config = setSectionEnabled(DEFAULT_HOMEPAGE_CONFIG, "testimonials", true);
    render(<EnterprisePlatformContent config={config} />);
    expect(document.getElementById("testimonials")).toBeNull();
  });
});
