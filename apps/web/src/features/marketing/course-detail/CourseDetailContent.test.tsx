import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getAllByText("Age 5–8").length).toBeGreaterThan(0);
    expect(screen.getByText("Card blurb")).toBeDefined();
    expect(screen.getByText("Build number sense early")).toBeDefined();
    expect(screen.getByText("Mental math foundations")).toBeDefined();
    expect(screen.getByText("Faster calculation")).toBeDefined();
    expect(screen.getAllByText("1 Lakh Success Scholarship!").length).toBeGreaterThan(0);
    expect(screen.getByText("Bead basics")).toBeDefined();
    const enroll = screen.getAllByRole("button", { name: "Enroll now" });
    expect(enroll.length).toBeGreaterThanOrEqual(1);
    expect(enroll[0]?.classList.contains("pub-course__enroll-btn")).toBe(true);
    expect(document.querySelector(".sa-main.sa-course-detail")).toBeTruthy();
  });

  it("regression_public_course_offer_banner_shows_full_image", () => {
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <CourseDetailContent
            program={createPublicCurriculumProgram({
              name: "Handwriting",
              marketingImageUrl: "https://cdn.example/handwriting-banner.jpg",
            })}
            marketingTheme="spark-academy"
            enrollHref="enroll"
          />
        </LeadModalProvider>
      </MemoryRouter>
    );

    const photo = document.querySelector(".pub-course__offer-photo");
    expect(photo?.getAttribute("src")).toBe("https://cdn.example/handwriting-banner.jpg");
  });

  it("regression_public_course_page_has_enroll_offer_card", () => {
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <CourseDetailContent program={program} marketingTheme="spark-academy" enrollHref="enroll" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("complementary", { name: "Enroll in this course" })).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Courses" }).getAttribute("href")).toBe("/#programs");
    expect(document.querySelector(".pub-course__rail")).toBeTruthy();
    expect(document.querySelector(".pub-course__rail .pub-course__offer")).toBeTruthy();
    expect(document.querySelector(".pub-course__dock")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Enroll now" }).length).toBeGreaterThanOrEqual(2);
  });

  it("regression_public_course_level_expand_has_structured_panels", () => {
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <CourseDetailContent
            program={createPublicCurriculumProgram({
              name: "Abacus",
              levels: [
                {
                  name: "Level 1",
                  levelCode: "L1",
                  topicsCovered: ["Finger basics"],
                  whyTake: "Build number sense early",
                  whatYouLearn: "Mental math foundations",
                  marketingVideoUrl: null,
                  modules: [
                    {
                      title: "Foundations",
                      lessons: [{ title: "Bead basics", durationMinutes: 15, contentType: "video" }],
                    },
                  ],
                },
              ],
            })}
            marketingTheme="spark-academy"
            enrollHref="enroll"
          />
        </LeadModalProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Level 1"));

    expect(screen.getByRole("heading", { level: 3, name: "Why this level" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Skills and outcomes" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Topics covered" })).toBeDefined();
    expect(document.querySelector(".pub-course__topic-chips")).toBeTruthy();
    expect(document.querySelector(".pub-course__lesson-index")?.textContent).toBe("01");
    expect(screen.getByText("15 min")).toBeDefined();
  });
});

describe("course detail enroll card CSS", () => {
  const css = readFileSync(resolve(__dirname, "course-detail.css"), "utf8");

  it("regression_public_course_enroll_card_stays_sticky_while_scrolling", () => {
    expect(css).toMatch(/\.marketing-page:has\(\.pub-course\)\s*\{[^}]*overflow-x:\s*visible/s);
    expect(css).toMatch(/\.pub-course__offer \{\s*position:\s*fixed;/);
    expect(css).toMatch(/height:\s*0;\s*overflow:\s*visible;/);
    expect(css).toMatch(/\.pub-course__offer-photo\s*\{[^}]*object-fit:\s*contain/s);
  });
});
