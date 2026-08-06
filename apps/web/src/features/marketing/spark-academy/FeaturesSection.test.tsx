import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { FeaturesSection } from "./FeaturesSection";
import { JourneySection } from "./JourneySection";

describe("FeaturesSection", () => {
  it("regression_renders_eyebrow_title_dividers_and_decorative_cards", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <FeaturesSection
        sections={config.featureSections}
        showcase={config.featuresShowcase}
        imageUrlFallback="https://example.com/student.jpg"
      />
    );

    expect(screen.getByText("Our Key Features")).toBeDefined();
    expect(screen.getByText("Powerful Features for Your Learning Journey")).toBeDefined();
    expect(screen.getByText(/From personalized recommendations/)).toBeDefined();
    expect(screen.getByText("Structured curriculum parents trust.")).toBeDefined();
    expect(document.querySelector(".sa-features__float--stats")).toBeDefined();
    expect(document.querySelector(".sa-features__yellow-ring")).toBeDefined();
    expect(screen.getByText("Last month")).toBeDefined();
    expect(screen.getByText("25.20%")).toBeDefined();
    expect(screen.getByText("Learning Progress")).toBeDefined();
    expect(screen.getByText("55%")).toBeDefined();
  });

  it("uses_features_showcase_image_and_overlay_overrides", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <FeaturesSection
        sections={config.featureSections}
        showcase={{
          ...config.featuresShowcase,
          imageUrl: "https://cdn.example/features.png",
          floatStatsLabel: "This quarter",
          floatStatsValue: "40%",
          floatProgressLabel: "Completion",
          floatProgressValue: "72%",
        }}
      />
    );
    expect(screen.getByText("This quarter")).toBeDefined();
    expect(screen.getByText("40%")).toBeDefined();
    expect(screen.getByText("Completion")).toBeDefined();
    expect(screen.getByText("72%")).toBeDefined();
  });
});

describe("JourneySection", () => {
  it("regression_renders_badge_rows_and_highlight_card", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<JourneySection trust={config.trustMedia!} />);

    expect(screen.getByText("Our Success")).toBeDefined();
    expect(screen.getByText("Our Journey to Excellence")).toBeDefined();
    expect(screen.getByText("2 Million Learners")).toBeDefined();
    expect(screen.getByText("500k+ 5 Star Feedbacks")).toBeDefined();
    expect(screen.getByText("Our Investment Fund Raised")).toBeDefined();
    expect(screen.getByText("1000+")).toBeDefined();
    expect(screen.getByText("20+")).toBeDefined();
    expect(screen.getByText("Top mentors around the globe")).toBeDefined();
  });

  it("uses_trust_media_image_and_highlight_overrides", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const trust = {
      ...config.trustMedia!,
      imageUrl: "https://cdn.example/journey.png",
      highlightLabel: "Partners worldwide",
      highlightPrimary: "50k+",
      highlightSecondary: "8+",
      highlightCaption: "Certified mentors",
    };
    const { container } = render(<JourneySection trust={trust} />);

    expect(screen.getByText("Partners worldwide")).toBeDefined();
    expect(screen.getByText("50k+")).toBeDefined();
    expect(screen.getByText("8+")).toBeDefined();
    expect(screen.getByText("Certified mentors")).toBeDefined();
    const media = container.querySelector(".sa-journey__highlight-photo");
    expect(media).toBeDefined();
  });

  it("falls_back_to_brand_stats_when_highlight_figures_empty", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const trust = {
      ...config.trustMedia!,
      highlightPrimary: "",
      highlightSecondary: "",
    };
    render(
      <JourneySection
        trust={trust}
        rich={{ brandStats: { franchiseCount: "12+", studentCount: "2M+" } }}
      />
    );
    expect(screen.getByText("2M+")).toBeDefined();
    expect(screen.getByText("12+")).toBeDefined();
  });
});
