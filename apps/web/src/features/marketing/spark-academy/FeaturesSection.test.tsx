import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("regression_spark_features_omits_view_all_float_action", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <FeaturesSection
        sections={config.featureSections}
        showcase={{
          ...config.featuresShowcase,
          floatStatsAction: "View all →",
        }}
      />
    );

    expect(screen.queryByText("View all →")).toBeNull();
    expect(document.querySelector(".sa-features__float-btn")).toBeNull();
  });

  it("regression_spark_features_floats_sit_on_visual_corners", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const { container } = render(
      <FeaturesSection
        sections={config.featureSections}
        showcase={config.featuresShowcase}
        imageUrlFallback="https://example.com/student.jpg"
      />
    );

    const visual = container.querySelector(".sa-features__visual");
    const stage = container.querySelector(".sa-features__photo-stage");
    expect(visual?.querySelector(":scope > .sa-features__float--stats")).toBeDefined();
    expect(visual?.querySelector(":scope > .sa-features__float--progress")).toBeDefined();
    expect(stage?.querySelector(".sa-features__float--stats")).toBeNull();
    expect(stage?.querySelector(".sa-features__float--progress")).toBeNull();
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

  it("regression_spark_homepage_features_keep_float_badges", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <FeaturesSection sections={config.featureSections} showcase={config.featuresShowcase} />
    );
    expect(document.querySelector(".sa-features__float--stats")).toBeTruthy();
    expect(document.querySelector(".sa-features__float--progress")).toBeTruthy();
  });

  it("hides_float_badges_when_showFloats_false", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <FeaturesSection
        sections={config.featureSections}
        showcase={config.featuresShowcase}
        showFloats={false}
      />
    );
    expect(document.querySelector(".sa-features__float")).toBeNull();
    expect(screen.queryByText("Last month")).toBeNull();
    expect(screen.queryByText("Learning Progress")).toBeNull();
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

  it("regression_spark_journey_renders_youtube_below_photo", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const trust = {
      ...config.trustMedia!,
      youtubeUrl: "https://youtube.com/shorts/IsPZdHWfXHQ?si=test",
    };
    const { container } = render(<JourneySection trust={trust} />);

    expect(container.querySelector(".sa-journey__highlight-photo")).toBeTruthy();
    const iframe = container.querySelector(".sa-journey__video iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube.com/embed/IsPZdHWfXHQ?playsinline=1");
    expect(container.querySelector("#trust")).toBeTruthy();
    expect(container.querySelector(".sa-journey__video.sa-reveal-item")).toBeNull();
  });

  it("regression_spark_journey_omits_youtube_when_url_empty", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    const { container } = render(<JourneySection trust={config.trustMedia!} />);
    expect(container.querySelector(".sa-journey__video")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("regression_spark_journey_video_css_is_fluid_on_mobile", () => {
    const css = readFileSync(resolve(__dirname, "spark-academy.css"), "utf8");
    expect(css).toMatch(/\.sa-journey__video \{[\s\S]*min-width:\s*0/);
    expect(css).toMatch(/\.sa-journey__video-frame \{[\s\S]*aspect-ratio:\s*16\s*\/\s*9/);
    expect(css).toMatch(/\.sa-journey__video-frame iframe \{[\s\S]*max-width:\s*100%/);
    expect(css).toMatch(/\.sa-journey__video-frame iframe \{[\s\S]*pointer-events:\s*auto/);
    expect(css).toMatch(/\.sa-reveal\.is-visible \{\s*transform:\s*none/);
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[\s\S]*\.sa-journey__video \{[\s\S]*padding:\s*0 1rem/
    );
    expect(css).toMatch(
      /@media \(max-width: 639px\) \{[\s\S]*\.sa-journey__video \{[\s\S]*padding:\s*0 0\.875rem/
    );
  });
});
