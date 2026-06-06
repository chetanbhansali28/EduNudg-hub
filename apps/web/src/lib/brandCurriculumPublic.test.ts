import { describe, expect, it } from "vitest";
import { parsePublicCurriculum } from "./brandCurriculumPublic";

describe("parsePublicCurriculum", () => {
  it("parses published program with levels", () => {
    const result = parsePublicCurriculum([
      {
        name: "Junior Program",
        description: "Foundations",
        why_take: "Build confidence",
        what_you_learn: "Mental math",
        marketing_video_url: "https://example.com/v",
        version_number: 2,
        levels: [
          {
            name: "Level 1",
            level_code: "L1",
            topics_covered: ["Basics", "Friends"],
            why_take: "Start here",
            what_you_learn: "Finger work",
            marketing_video_url: null,
            modules: [
              {
                title: "Module A",
                lessons: [{ title: "Intro", duration_minutes: 45, content_type: "article" }],
              },
            ],
          },
        ],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Junior Program");
    expect(result[0]?.versionNumber).toBe(2);
    expect(result[0]?.levels[0]?.levelCode).toBe("L1");
    expect(result[0]?.levels[0]?.modules[0]?.title).toBe("Module A");
    expect(result[0]?.levels[0]?.modules[0]?.lessons[0]?.durationMinutes).toBe(45);
  });

  it("returns empty array for invalid payload", () => {
    expect(parsePublicCurriculum(null)).toEqual([]);
    expect(parsePublicCurriculum([{ foo: "bar" }])).toEqual([]);
  });
});
