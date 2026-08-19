import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { CourseDetailContent } from "./CourseDetailContent";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";

const program = createPublicCurriculumProgram({
  name: "Junior Abacus Path",
  description: "Card blurb",
  whyTake: "Build number sense early",
  whatYouLearn: "Mental math foundations",
  scholarshipHighlight: "1 Lakh Success Scholarship!",
  marketingBenefits: ["Faster calculation"],
  ageLabel: "Age 5–8",
  levels: [
    {
      name: "Level 1",
      levelCode: "L1",
      topicsCovered: ["Finger basics"],
      whyTake: null,
      whatYouLearn: null,
      marketingVideoUrl: null,
      modules: [
        {
          title: "Foundations",
          lessons: [{ title: "Bead basics", durationMinutes: 15, contentType: "video" }],
        },
      ],
    },
  ],
});

describe("CourseDetailContent", () => {
  it("regression_public_course_page_shows_curriculum_fields", () => {
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <CourseDetailContent program={program} marketingTheme="spark-academy" enrollHref="enroll" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Junior Abacus Path" })).toBeDefined();
    expect(screen.getByText("Age 5–8")).toBeDefined();
    expect(screen.getByText("Card blurb")).toBeDefined();
    expect(screen.getByText("Build number sense early")).toBeDefined();
    expect(screen.getByText("Mental math foundations")).toBeDefined();
    expect(screen.getByText("Faster calculation")).toBeDefined();
    expect(screen.getByText("1 Lakh Success Scholarship!")).toBeDefined();
    expect(screen.getByText("Bead basics")).toBeDefined();
    expect(screen.getByRole("button", { name: "Enroll now" })).toBeDefined();
    expect(document.querySelector(".sa-main.sa-course-detail")).toBeTruthy();
  });
});
