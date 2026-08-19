import { describe, expect, it } from "vitest";
import { createPublicCurriculumProgram } from "./brandCurriculumPublic";
import {
  findPublicCourse,
  publicCoursePath,
  publicCourseSlug,
  publicCourseSlugs,
} from "./publicCourseSlug";

describe("publicCourseSlug", () => {
  it("slugifies the course name", () => {
    const program = createPublicCurriculumProgram({ name: "Junior Abacus" });
    expect(publicCourseSlug(program, [program])).toBe("junior-abacus");
    expect(publicCoursePath(program, [program])).toBe("/courses/junior-abacus");
  });

  it("appends an id suffix when two names collide", () => {
    const a = createPublicCurriculumProgram({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Abacus",
    });
    const b = createPublicCurriculumProgram({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Abacus",
    });
    const slugs = publicCourseSlugs([a, b]);
    expect([...slugs.values()]).toEqual(["abacus", "abacus-bbbbbbbb"]);
    expect(findPublicCourse([a, b], "abacus-bbbbbbbb")).toBe(b);
  });

  it("finds a published course and ignores unknown slugs", () => {
    const program = createPublicCurriculumProgram({ name: "Vedic Maths" });
    expect(findPublicCourse([program], "vedic-maths")?.name).toBe("Vedic Maths");
    expect(findPublicCourse([program], "missing")).toBeUndefined();
  });
});
