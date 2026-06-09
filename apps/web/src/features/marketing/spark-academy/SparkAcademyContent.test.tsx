import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { SparkAcademyContent } from "./SparkAcademyContent";

describe("SparkAcademyContent", () => {
  it("regression_renders_hero_courses_and_faq_from_homepage_config", () => {
    const config = mergeSparkAcademyLandingConfig("Educat Demo");
    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="educat-demo"
          publicCurriculum={[
            {
              name: "Abacus Junior",
              description: "Foundations for young learners",
              whyTake: null,
              whatYouLearn: null,
              marketingVideoUrl: null,
              versionNumber: 1,
              levels: [{ name: "Level 1", levelCode: "L1", topicsCovered: [], whyTake: null, whatYouLearn: null, marketingVideoUrl: null, modules: [] }],
            },
          ]}
          publicStats={{ centersCount: 10, studentsCount: 5000 }}
        />
      </LeadModalProvider>
    );

    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByText(/Shape your future with/)).toBeDefined();
    expect(screen.getByText("Courses designed for success")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus Junior" })).toBeDefined();
    expect(screen.getByText("Our Journey to Excellence")).toBeDefined();
    expect(screen.getByText("What Our Learners Are Saying")).toBeDefined();
    expect(screen.getByText("What age group is suitable?")).toBeDefined();
    expect(screen.queryByText("Own an abacus center in your city")).toBeNull();
    expect(screen.queryByText("Give your child a head start in mental math")).toBeNull();
  });
});
