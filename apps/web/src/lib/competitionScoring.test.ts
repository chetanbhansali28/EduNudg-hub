import { describe, expect, it } from "vitest";
import { competitionAnswersMatch, scoreCompetitionAnswers } from "./competitionScoring";

describe("competitionScoring", () => {
  it("treats multi-correct as all-or-nothing", () => {
    expect(competitionAnswersMatch(["a", "b"], ["b", "a"])).toBe(true);
    expect(competitionAnswersMatch(["a"], ["a", "b"])).toBe(false);
    expect(competitionAnswersMatch(["a", "b", "c"], ["a", "b"])).toBe(false);
  });

  it("scores a paper by matching sets", () => {
    expect(
      scoreCompetitionAnswers([
        { selectedOptionIds: ["1"], correctOptionIds: ["1"] },
        { selectedOptionIds: ["2", "3"], correctOptionIds: ["3", "2"] },
        { selectedOptionIds: ["4"], correctOptionIds: ["5"] },
      ])
    ).toEqual({ score: 2, maxScore: 3 });
  });
});
