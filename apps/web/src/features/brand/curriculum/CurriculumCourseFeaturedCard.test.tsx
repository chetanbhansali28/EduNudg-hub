import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CurriculumProgram } from "@/lib/curriculumApi";
import { CurriculumMobileCourseCard } from "@edunudg/ui";

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

describe("Curriculum mobile course card", () => {
  it("regression_renders_program_rows_for_active_course", () => {
    render(
      <CurriculumMobileCourseCard
        initials="AC"
        title={sampleCourse.name}
        meta="Age 6–10 • 2 programs"
        excerpt={sampleCourse.description ?? ""}
        status="active"
        programs={[
          { id: "l1", title: "Level 1", code: "L1" },
          { id: "l2", title: "Level 2", code: "L2" },
        ]}
        onEditProgram={() => undefined}
        onAddProgram={() => undefined}
      />
    );
    expect(screen.getByText("Abacus Core")).toBeDefined();
    expect(screen.getByText(/Level 1/)).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Edit" }).length).toBeGreaterThan(0);
  });
});
