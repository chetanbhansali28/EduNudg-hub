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
});
