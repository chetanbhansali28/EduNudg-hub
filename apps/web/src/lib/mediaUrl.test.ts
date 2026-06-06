import { describe, expect, it } from "vitest";
import { isVideoMediaUrl, withMediaCacheBust } from "./mediaUrl";

describe("isVideoMediaUrl", () => {
  it("detects mp4 and webm urls", () => {
    expect(isVideoMediaUrl("https://cdn.example.com/hero/asset.mp4")).toBe(true);
    expect(isVideoMediaUrl("https://cdn.example.com/hero/asset.mp4?v=1")).toBe(true);
    expect(isVideoMediaUrl("https://cdn.example.com/hero/asset.png")).toBe(false);
  });
});

describe("withMediaCacheBust", () => {
  it("regression_appends_version_query", () => {
    expect(withMediaCacheBust("https://example.com/a.png", 123)).toBe("https://example.com/a.png?v=123");
  });
});
