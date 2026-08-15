import { describe, expect, it } from "vitest";
import type { CurriculumProgram } from "@/lib/curriculumApi";
import { courseToForm } from "@/features/brand/curriculum/curriculumForms";

const sample: CurriculumProgram = {
  id: "p1",
  name: "Abacus",
  description: "Desc",
  why_take: "Parents want faster mental math",
  what_you_learn: "Anzan and visualization",
  marketing_video_url: "https://example.com/video",
  marketing_image_url: "https://example.com/banner.png",
  age_label: "Age 6–14",
  marketing_benefits: ["Faster mental math", "Confidence"],
  scholarship_highlight: "1 Lakh Success Scholarship!",
  is_active: true,
};

describe("curriculumForms", () => {
  it("courseToForm maps parent marketing fields from a saved course", () => {
    expect(courseToForm(sample)).toEqual({
      name: "Abacus",
      description: "Desc",
      whyTake: "Parents want faster mental math",
      whatYouLearn: "Anzan and visualization",
      videoUrl: "https://example.com/video",
      ageLabel: "Age 6–14",
      marketingImageUrl: "https://example.com/banner.png",
      benefits: ["Faster mental math", "Confidence"],
      scholarshipHighlight: "1 Lakh Success Scholarship!",
    });
  });

  it("courseToForm treats non-array benefits as empty", () => {
    expect(courseToForm({ ...sample, marketing_benefits: null }).benefits).toEqual([]);
  });
});
