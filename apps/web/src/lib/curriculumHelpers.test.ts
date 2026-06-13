import { describe, expect, it } from "vitest";
import { parseTopicsComma, topicsToString } from "./curriculumHelpers";

describe("curriculumHelpers", () => {
  it("topicsToString joins string array", () => {
    expect(topicsToString(["a", "b"])).toBe("a, b");
  });

  it("parseTopicsComma splits and trims", () => {
    expect(parseTopicsComma("a, b , c")).toEqual(["a", "b", "c"]);
  });
});
