import { describe, expect, it } from "vitest";
import { withDefaultFeatureVideos } from "./marketingFeatureSections";

describe("withDefaultFeatureVideos", () => {
  it("regression_fills_missing_video_url_by_section_index", () => {
    const out = withDefaultFeatureVideos([
      {
        id: "curriculum",
        title: "Curriculum",
        titleSerif: "trust.",
        body: "Body",
      },
    ]);
    expect(out[0].videoUrl).toContain(".mp4");
  });
});
