import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
      <LeadModalProvider>
        <CoursesSection
          programs={[program("Abacus"), program("Handwriting"), program("Vedic Math")]}
          ctaHref="#enroll"
        />
      </LeadModalProvider>
    );

    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Handwriting" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Math" })).toBeDefined();
    expect(screen.queryByRole("button", { name: exactAccessibleName("View all courses") })).toBeNull();
  });

  it("regression_spark_courses_lists_all_published_programs", () => {
    render(
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
    );

    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Handwriting" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Math" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Rubik's Cube" })).toBeDefined();
    expect(screen.queryByRole("button", { name: exactAccessibleName("View all courses") })).toBeNull();
  });
});
