import { describe, expect, it } from "vitest";
import type { CurriculumProgram } from "@/lib/curriculumApi";
import {
  courseMetaLine,
  courseStatus,
  curriculumTabCounts,
  editorCourseDescription,
  editorCourseTitle,
  filterCoursesByTab,
  impactStatChips,
  matchesCurriculumSearch,
} from "@/features/brand/curriculum/curriculumBrandHelpers";

const sample: CurriculumProgram = {
  id: "p1",
  name: "Abacus",
  description: "Learning the abacus transforms counting.",
  why_take: null,
  what_you_learn: null,
  marketing_video_url: null,
  marketing_image_url: null,
  age_label: "Level 1 to 8",
  marketing_benefits: [],
  scholarship_highlight: null,
  is_active: true,
};

describe("curriculumBrandHelpers", () => {
  it("maps active and draft course status", () => {
    expect(courseStatus(sample)).toBe("active");
    expect(courseStatus({ ...sample, is_active: false })).toBe("draft");
  });

  it("builds course meta line with program count", () => {
    expect(courseMetaLine(sample, 2)).toBe("Level 1 to 8 • 2 programs");
  });

  it("filters courses by mobile tab", () => {
    const courses = [sample, { ...sample, id: "p2", is_active: false }];
    expect(filterCoursesByTab(courses, "active")).toHaveLength(1);
    expect(filterCoursesByTab(courses, "drafts")).toHaveLength(1);
    expect(curriculumTabCounts(courses)).toEqual({ active: 1, drafts: 1, archived: 0 });
  });

  it("matches search across course and program names", () => {
    expect(matchesCurriculumSearch(sample, ["Level 1"], "abacus")).toBe(true);
    expect(matchesCurriculumSearch(sample, ["Level 1"], "vedic")).toBe(false);
  });

  it("formats editor title and impact chips", () => {
    expect(editorCourseTitle("Abacus")).toBe("Abacus Curriculum");
    expect(editorCourseDescription("Abacus")).toContain("core Abacus course");
    expect(impactStatChips({ authorizedCenters: 24, activeBatches: 1240 })).toEqual([
      "24 Centers Authorized",
      "1,240 Active Batches",
    ]);
    expect(impactStatChips({ authorizedCenters: 0, activeBatches: 0 })).toEqual([
      "0 Centers Authorized",
      "0 Active Batches",
    ]);
  });
});
