import { describe, expect, it } from "vitest";
import type { StoryRow } from "./SuccessStoryCard";
import {
  filterStories,
  formatStoryRelativeWhen,
  storyAuthorLine,
  storyCounts,
  storyStatusPresentation,
} from "./successStoriesHelpers";

function story(partial: Partial<StoryRow> & Pick<StoryRow, "id" | "title">): StoryRow {
  return {
    quote: "Great academy",
    author_name: "Asha",
    author_role: "Parent",
    rating: 5,
    image_url: null,
    sort_order: 0,
    is_published: true,
    created_at: "2026-08-01T10:00:00Z",
    ...partial,
  };
}

describe("successStoriesHelpers", () => {
  const rows: StoryRow[] = [
    story({ id: "1", title: "Published with photo", is_published: true, image_url: "https://img.example/a.jpg" }),
    story({ id: "2", title: "Draft quote", is_published: false, author_name: "Ravi", image_url: null }),
    story({ id: "3", title: "Published no photo", is_published: true, image_url: "  " }),
  ];

  it("counts published, draft, with photo, and total", () => {
    expect(storyCounts(rows)).toEqual({
      published: 2,
      draft: 1,
      withPhoto: 1,
      all: 3,
    });
  });

  it("filters published vs draft and search", () => {
    expect(filterStories(rows, "published").map((row) => row.id)).toEqual(["1", "3"]);
    expect(filterStories(rows, "draft").map((row) => row.id)).toEqual(["2"]);
    expect(filterStories(rows, "published", "ravi").map((row) => row.id)).toEqual(["2"]);
  });

  it("presents published and draft status badges", () => {
    expect(storyStatusPresentation(rows[0]!)).toEqual({ label: "PUBLISHED", tone: "approved" });
    expect(storyStatusPresentation(rows[1]!)).toEqual({ label: "DRAFT", tone: "pending" });
  });

  it("formats author line and relative time", () => {
    expect(storyAuthorLine(rows[0]!)).toBe("Asha · Parent");
    expect(formatStoryRelativeWhen("2026-08-01T10:00:00Z", Date.parse("2026-08-01T10:05:00Z"))).toBe(
      "5 minutes ago"
    );
  });
});
