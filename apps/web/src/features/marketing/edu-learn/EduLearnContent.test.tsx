import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { mergeEduLearnLandingConfig, mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { EduLearnContent } from "./EduLearnContent";

describe("EduLearnContent", () => {
  it("regression_edu_learn_homepage_matches_green_orange_layout", () => {
    const config = mergeEduLearnLandingConfig("AbacusWorld");
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <EduLearnContent config={config} portalMode="brand" brandSlug="abacusworld" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByText(/Keep/)).toBeDefined();
    expect(screen.getByText("Learning")).toBeDefined();
    expect(screen.getByText(/on Track/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Get Started" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Apply franchise" })).toBeDefined();
    expect(document.querySelector(".el-hero__blob")).toBeTruthy();
    expect(document.querySelector(".el-doodles--hero")).toBeTruthy();
    expect(document.querySelector(".el-features__grid")).toBeTruthy();
    expect(document.querySelectorAll(".el-stat-card").length).toBe(3);
    expect(document.querySelector(".el-stat-card--2")).toBeTruthy();
    expect(document.querySelector(".el-cta__action")).toBeTruthy();
    expect(document.querySelectorAll(".el-quote-card").length).toBe(3);
    expect(document.querySelectorAll(".el-resource-card").length).toBe(3);
    expect(screen.getByText("Join our community of school partners")).toBeDefined();
  });

  it("regression_edu_learn_shows_published_courses_and_faq_from_spark_landing", () => {
    const spark = mergeSparkAcademyLandingConfig("AbacusWorld");
    const config = mergeEduLearnLandingConfig("AbacusWorld", spark);
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <EduLearnContent
            config={config}
            portalMode="brand"
            brandSlug="abacusworld"
            publicCurriculum={[
              createPublicCurriculumProgram({
                name: "Abacus Junior",
                description: "Foundations for young learners",
                levels: [],
              }),
            ]}
          />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(document.getElementById("programs")).toBeTruthy();
    expect(document.getElementById("curriculum")).toBeTruthy();
    expect(document.querySelector(".el-course-card")).toBeTruthy();
    expect(document.querySelector(".el-course-card__body")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus Junior" })).toBeDefined();
    expect(screen.getByText("Foundations for young learners")).toBeDefined();
    expect(document.querySelector(".el-faq")).toBeTruthy();
    expect(config.faq[0]?.question).toBeTruthy();
    expect(screen.getByText(config.faq[0]!.question)).toBeDefined();
  });

  it("regression_edu_learn_stats_renders_youtube_below_photo", () => {
    const config = mergeEduLearnLandingConfig("AbacusWorld");
    config.trustMedia = {
      ...config.trustMedia!,
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    };
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <EduLearnContent config={config} portalMode="brand" brandSlug="abacusworld" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(document.querySelector(".el-stats__photo")).toBeTruthy();
    expect(document.querySelector(".el-stats__video iframe")?.getAttribute("src")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1"
    );
  });

  it("regression_edu_learn_stats_video_css_is_fluid_on_mobile", () => {
    const css = readFileSync(resolve(__dirname, "edu-learn.css"), "utf8");
    expect(css).toMatch(/\.el-stats__video \{[\s\S]*min-width:\s*0/);
    expect(css).toMatch(/\.el-stats__video-frame \{[\s\S]*aspect-ratio:\s*16\s*\/\s*9/);
    expect(css).toMatch(/\.el-stats__video-frame iframe \{[\s\S]*max-width:\s*100%/);
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[\s\S]*\.el-stats__video \{[\s\S]*margin-top:\s*1\.25rem/
    );
  });
});
