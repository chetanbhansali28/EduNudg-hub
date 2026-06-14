import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { AbacusCurriculumSection } from "./AbacusCurriculumSection";

const sampleProgram = createPublicCurriculumProgram({
  name: "Abacus",
  description: "An abacus is a hand-operated calculating tool.",
  levels: [
    {
      name: "Level 1",
      levelCode: "L1",
      topicsCovered: ["Finger basics"],
      whyTake: "Build foundations",
      whatYouLearn: "Core techniques",
      marketingVideoUrl: null,
      modules: [
        {
          title: "Numbers 1–100 on abacus",
          lessons: [{ title: "Welcome", durationMinutes: 30, contentType: "article" }],
        },
      ],
    },
  ],
});

describe("AbacusCurriculumSection", () => {
  it("renders nothing when no published programs", () => {
    const { container } = render(<AbacusCurriculumSection programs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("regression_renders_syllabus_tree_at_curriculum_anchor", () => {
    const { container } = render(<AbacusCurriculumSection programs={[sampleProgram]} />);

    expect(container.querySelector("section#curriculum.ac-curriculum")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Structured learning path" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(screen.getByText("An abacus is a hand-operated calculating tool.")).toBeDefined();
    expect(screen.getByText("Level 1")).toBeDefined();
    expect(screen.getByText("L1")).toBeDefined();
    expect(screen.getByText("Numbers 1–100 on abacus")).toBeDefined();
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByText("30 min")).toBeDefined();
  });
});
