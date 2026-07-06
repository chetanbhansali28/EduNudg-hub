import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { SparkAcademyHero, buildHeroStats } from "./SparkAcademyHero";

describe("SparkAcademyHero", () => {
  it("regression_renders_rounded_stats_bar_with_dot_separators", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<SparkAcademyHero config={config} programCount={0} />);

    expect(document.querySelector(".sa-hero__stats-bar")).toBeDefined();
    expect(document.querySelectorAll(".sa-hero__stats-dot")).toHaveLength(3);
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByText("Satisfaction rate")).toBeDefined();
    expect(screen.getByText("12+")).toBeDefined();
    expect(screen.getByText("Years of experience")).toBeDefined();
    expect(screen.getByText("20k+")).toBeDefined();
    expect(screen.getByText("Total Courses")).toBeDefined();
    expect(screen.getByText("90+")).toBeDefined();
    expect(screen.getByText("Course Category")).toBeDefined();
  });

  it("shows manual learner count float card when brandStats.studentCount is set", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    config.footer.rich = {
      ...config.footer.rich!,
      brandStats: { studentCount: "8k+" },
    };
    render(<SparkAcademyHero config={config} programCount={0} />);
    expect(screen.getByText("8k+")).toBeDefined();
    expect(screen.getByText("Learners")).toBeDefined();
  });
});

describe("buildHeroStats", () => {
  it("uses custom stats when four are configured", () => {
    const config = mergeSparkAcademyLandingConfig("Test");
    const stats = buildHeroStats(config, 0);
    expect(stats).toHaveLength(4);
    expect(stats[0]).toEqual({ value: "100%", label: "Satisfaction rate" });
  });

  it("replaces course count when programs exist", () => {
    const config = mergeSparkAcademyLandingConfig("Test");
    config.footer.rich!.customStats = [];
    const stats = buildHeroStats(config, 15);
    expect(stats.find((s) => s.label === "Total Courses")?.value).toBe("15+");
  });
});
