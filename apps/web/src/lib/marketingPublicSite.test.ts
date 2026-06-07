import { describe, expect, it } from "vitest";
import { toYoutubeEmbedUrl } from "./marketingPublicSite";

describe("toYoutubeEmbedUrl", () => {
  it("parses watch URLs", () => {
    expect(toYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("parses youtu.be URLs", () => {
    expect(toYoutubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("returns null for empty input", () => {
    expect(toYoutubeEmbedUrl("")).toBeNull();
  });
});
