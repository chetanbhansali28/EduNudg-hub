import { describe, expect, it } from "vitest";
import { countProgramLessons, programLessonLabel } from "./curriculumHelpers";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";

const sampleProgram: PublicCurriculumProgram = {
  name: "Core Program",
  description: null,
  whyTake: null,
  whatYouLearn: null,
  marketingVideoUrl: null,
  versionNumber: 1,
  levels: [
    {
      name: "Level 1",
      levelCode: "L1",
      topicsCovered: [],
      whyTake: null,
      whatYouLearn: null,
      marketingVideoUrl: null,
      modules: [
        {
          title: "Module A",
          lessons: [{ title: "Lesson 1", durationMinutes: 10, contentType: "video" }],
        },
      ],
    },
  ],
};

describe("curriculumHelpers", () => {
  it("counts lessons across modules", () => {
    expect(countProgramLessons(sampleProgram)).toBe(1);
    expect(programLessonLabel(sampleProgram)).toBe("1 lesson");
  });
});
