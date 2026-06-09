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
        imageUrl="https://example.com/student.jpg"
      />
    );

    expect(screen.getByText("Our Key Features")).toBeDefined();
    expect(screen.getByText("Powerful Features for Your Learning Journey")).toBeDefined();
    expect(screen.getByText(/From personalized recommendations/)).toBeDefined();
    expect(screen.getByText("Structured curriculum parents trust.")).toBeDefined();
    expect(document.querySelector(".sa-features__float--stats")).toBeDefined();
    expect(document.querySelector(".sa-features__yellow-ring")).toBeDefined();
  });
});

describe("JourneySection", () => {
  it("regression_renders_badge_rows_and_highlight_card", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <JourneySection
        trust={config.trustMedia!}
        publicStats={{ centersCount: 12, studentsCount: 2_000_000 }}
      />
    );

    expect(screen.getByText("Our Success")).toBeDefined();
    expect(screen.getByText("Our Journey to Excellence")).toBeDefined();
    expect(screen.getByText("2 Million Learners")).toBeDefined();
    expect(screen.getByText("500k+ 5 Star Feedbacks")).toBeDefined();
    expect(screen.getByText("Our Investment Fund Raised")).toBeDefined();
    expect(screen.getByText("2M+")).toBeDefined();
    expect(screen.getByText("12+")).toBeDefined();
    expect(screen.getByText("Top mentors around the globe")).toBeDefined();
  });
});
