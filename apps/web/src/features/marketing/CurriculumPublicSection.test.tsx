import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { CurriculumPublicSection } from "./CurriculumPublicSection";

const sampleProgram = createPublicCurriculumProgram({
  name: "Junior Track",
  description: "Foundations for ages 4–7",
  whyTake: "Build confidence early",
  whatYouLearn: "Mental math basics",
  marketingVideoUrl: "https://example.com/overview",
  versionNumber: 2,
  levels: [
    {
      name: "Level 1",
      levelCode: "L1",
      topicsCovered: ["Finger basics", "Small friends"],
      whyTake: "Start with foundations",
      whatYouLearn: "Core techniques",
      marketingVideoUrl: null,
      modules: [
        {
          title: "Getting started",
          lessons: [{ title: "Welcome", durationMinutes: 30, contentType: "article" }],
        },
      ],
    },
  ],
});

describe("CurriculumPublicSection", () => {
  it("renders nothing when no published programs", () => {
    const { container } = render(<CurriculumPublicSection programs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("regression_renders_horizontal_scroller_with_full_program_details", () => {
    render(<CurriculumPublicSection programs={[sampleProgram, { ...sampleProgram, name: "Senior Track" }]} />);

    expect(document.querySelector(".novu-curriculum-section__scroller")).toBeTruthy();
    expect(screen.getAllByText("Foundations for ages 4–7")).toHaveLength(2);
    expect(screen.getAllByText("Build confidence early")).toHaveLength(2);
    expect(screen.getAllByText("Watch program overview")).toHaveLength(2);
    expect(screen.getAllByText("Getting started")).toHaveLength(2);
    expect(screen.getAllByText("Welcome")).toHaveLength(2);
    expect(screen.getByLabelText("Scroll programs left")).toBeDefined();
  });
});
