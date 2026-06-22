import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { setSectionEnabled } from "@/lib/homepageSections";
import { AbacusClassicContent } from "./AbacusClassicContent";
import { LeadModalProvider } from "./LeadModalContext";
import { MarketingLeadModals } from "./MarketingLeadModals";

function wrapWithLeadModal(ui: ReactNode) {
  return (
    <LeadModalProvider>
      {ui}
      <MarketingLeadModals brandSlug="abacus" />
    </LeadModalProvider>
  );
}

const syllabusProgram = createPublicCurriculumProgram({
  name: "Abacus",
  description: "Course overview",
  levels: [
    {
      name: "Level 1",
      levelCode: "L1",
      topicsCovered: [],
      whyTake: null,
      whatYouLearn: null,
      marketingVideoUrl: null,
      modules: [{ title: "Chapter one", lessons: [{ title: "Lesson A", durationMinutes: null, contentType: null }] }],
    },
  ],
});

describe("AbacusClassicContent curriculum syllabus", () => {
  it("regression_programs_and_curriculum_are_separate_sections", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const { container } = render(
      wrapWithLeadModal(<AbacusClassicContent config={config} publicCurriculum={[syllabusProgram]} />)
    );

    expect(container.querySelector("#programs.ac-programs-grid")).toBeTruthy();
    expect(container.querySelector("#curriculum.ac-curriculum")).toBeTruthy();
    expect(container.querySelector("#programs #curriculum")).toBeNull();
  });

  it("regression_hides_syllabus_when_section_toggle_off", () => {
    const config = setSectionEnabled(
      mergeAbacusClassicLandingConfig("Smart Brain Abacus"),
      "curriculumSyllabus",
      false
    );
    const { container } = render(
      wrapWithLeadModal(<AbacusClassicContent config={config} publicCurriculum={[syllabusProgram]} />)
    );

    expect(container.querySelector("#curriculum.ac-curriculum")).toBeNull();
  });
});
