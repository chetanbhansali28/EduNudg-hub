import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CurriculumProgram } from "@/lib/curriculumApi";
import { CurriculumCourseFeaturedCard } from "./CurriculumCourseFeaturedCard";

const sampleCourse: CurriculumProgram = {
  id: "p1",
  name: "Abacus Core",
  description: "Desc",
  why_take: null,
  what_you_learn: null,
  marketing_video_url: null,
  marketing_image_url: null,
  age_label: "Age 6–10",
  marketing_benefits: [],
  scholarship_highlight: null,
  is_active: true,
};

describe("CurriculumCourseFeaturedCard", () => {
  it("regression_renders_ops_featured_card", () => {
    render(
      <CurriculumCourseFeaturedCard course={sampleCourse} programCount={3} onViewDetails={() => undefined} />
    );
    expect(screen.getByText("Abacus Core")).toBeDefined();
    expect(screen.getByText("3 programs")).toBeDefined();
    expect(document.querySelector(".ed-ops-featured-card")).toBeTruthy();
  });
});
