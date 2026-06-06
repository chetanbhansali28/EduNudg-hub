import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { MarketingContent } from "./MarketingContent";

vi.mock("./useScrollReveal", () => ({
  useScrollReveal: vi.fn(),
}));

vi.mock("./FeatureScrollSection", () => ({
  FeatureScrollSection: () => <div data-testid="features" />,
}));

vi.mock("./HighlightsScroller", () => ({
  HighlightsScroller: () => null,
}));

vi.mock("./PrivacySection", () => ({
  PrivacySection: () => null,
}));

vi.mock("./TestimonialsCarousel", () => ({
  TestimonialsCarousel: () => null,
}));

vi.mock("./FranchiseSignupSection", () => ({
  FranchiseSignupSection: () => null,
}));

vi.mock("./BrandStudentApplicationSection", () => ({
  BrandStudentApplicationSection: () => null,
}));

describe("MarketingContent", () => {
  it("regression_renders_loading_when_config_hero_missing", () => {
    render(
      <MarketingContent
        config={{} as ReturnType<typeof buildBrandLandingConfig>}
        portalMode="brand"
        brandSlug="abacusworld"
      />
    );
    expect(screen.getByText("Loading…")).toBeDefined();
  });

  it("regression_renders_curriculum_section_on_brand_home_when_programs_exist", () => {
    const config = buildBrandLandingConfig("Abacus World");
    render(
      <MarketingContent
        config={config}
        portalMode="brand"
        brandSlug="abacusworld"
        publicCurriculum={[
          {
            name: "Junior Track",
            description: "Foundations",
            whyTake: null,
            whatYouLearn: null,
            marketingVideoUrl: null,
            versionNumber: 1,
            levels: [],
          },
        ]}
      />
    );

    expect(document.getElementById("curriculum")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Junior Track/i })).toBeDefined();
  });

  it("regression_renders_curriculum_section_on_center_home_when_programs_exist", () => {
    const config = buildBrandLandingConfig("Abacus World");
    render(
      <MarketingContent
        config={config}
        portalMode="center"
        brandSlug="abacusworld"
        centerSlug="koramangala"
        publicCurriculum={[
          {
            name: "Core Program",
            description: null,
            whyTake: "Build focus",
            whatYouLearn: null,
            marketingVideoUrl: null,
            versionNumber: 0,
            levels: [],
          },
        ]}
      />
    );

    expect(document.getElementById("curriculum")).toBeTruthy();
    expect(screen.getByText("Build focus")).toBeDefined();
  });
});
