import { describe, expect, it } from "vitest";
import { parsePublicCurriculum, programMarketingBenefits } from "./brandCurriculumPublic";

describe("parsePublicCurriculum", () => {
  it("parses published program with levels and marketing fields", () => {
    const result = parsePublicCurriculum([
      {
        name: "Junior Program",
        description: "Foundations",
        why_take: "Build confidence",
        what_you_learn: "Mental math",
        marketing_video_url: "https://example.com/v",
        marketing_image_url: "https://example.com/abacus.jpg",
        age_label: "Age 6–14",
        marketing_benefits: ["Kids become superfast in math", "Better focus"],
        scholarship_highlight: "1 Lakh Success Scholarship!",
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
    expect(result[0]?.marketingImageUrl).toBe("https://example.com/abacus.jpg");
    expect(result[0]?.ageLabel).toBe("Age 6–14");
    expect(result[0]?.marketingBenefits).toEqual(["Kids become superfast in math", "Better focus"]);
    expect(result[0]?.scholarshipHighlight).toBe("1 Lakh Success Scholarship!");
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

describe("programMarketingBenefits", () => {
  it("prefers dedicated marketing benefits over legacy whatYouLearn", () => {
    const program = parsePublicCurriculum([
      {
        name: "Abacus",
        marketing_benefits: ["Benefit A"],
        what_you_learn: "Legacy line",
        version_number: 1,
        levels: [],
      },
    ])[0]!;

    expect(programMarketingBenefits(program)).toEqual(["Benefit A"]);
  });

  it("falls back to newline-separated whatYouLearn", () => {
    const program = parsePublicCurriculum([
      {
        name: "Abacus",
        what_you_learn: "- Line one\nLine two",
        version_number: 1,
        levels: [],
      },
    ])[0]!;

    expect(programMarketingBenefits(program)).toEqual(["Line one", "Line two"]);
  });
});
