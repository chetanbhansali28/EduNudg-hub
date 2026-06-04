import { describe, expect, it } from "vitest";
import { parsePublicSuccessStories } from "./brandSuccessStoriesPublic";

describe("parsePublicSuccessStories", () => {
  it("parses success story rows from get_brand_landing_public", () => {
    const stories = parsePublicSuccessStories([
      { quote: "Great program", author: "Parent A", rating: 5, title: "Trial" },
      { quote: "Skipped", author: 123 },
    ]);
    expect(stories).toEqual([{ quote: "Great program", author: "Parent A", rating: 5, title: "Trial" }]);
  });

  it("regression_returns_empty_when_field_missing", () => {
    expect(parsePublicSuccessStories(undefined)).toEqual([]);
    expect(parsePublicSuccessStories(null)).toEqual([]);
  });
});
