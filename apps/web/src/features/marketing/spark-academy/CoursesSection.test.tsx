import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { exactAccessibleName } from "@/test/exactAccessibleName";
import { CoursesSection } from "./CoursesSection";

function program(name: string) {
  return createPublicCurriculumProgram({ name, description: `${name} blurb` });
}

describe("CoursesSection", () => {
  it("regression_spark_view_all_courses_hidden_when_catalog_fits", () => {
    render(
      <MemoryRouter>
      <LeadModalProvider>
        <CoursesSection
          programs={[program("Abacus"), program("Handwriting"), program("Vedic Math")]}
          ctaHref="#enroll"
        />
      </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Handwriting" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Math" })).toBeDefined();
    expect(screen.queryByRole("button", { name: exactAccessibleName("View all courses") })).toBeNull();
  });

  it("regression_spark_courses_lists_all_published_programs", () => {
    render(
      <MemoryRouter>
      <LeadModalProvider>
        <CoursesSection
          programs={[
            program("Abacus"),
            program("Handwriting"),
            program("Vedic Math"),
            program("Rubik's Cube"),
          ]}
          ctaHref="#enroll"
        />
      </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Handwriting" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Math" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Rubik's Cube" })).toBeDefined();
    expect(screen.queryByRole("button", { name: exactAccessibleName("View all courses") })).toBeNull();
  });

  it("regression_spark_course_card_links_to_public_detail", () => {
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <CoursesSection programs={[program("Junior Abacus Path")]} ctaHref="#enroll" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    const detail = screen.getByRole("link", { name: /Junior Abacus Path/ });
    expect(detail.getAttribute("href")).toBe("/courses/junior-abacus-path");
    expect(screen.getByRole("button", { name: exactAccessibleName("Enroll now") })).toBeDefined();
  });
});
