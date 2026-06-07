import { describe, expect, it } from "vitest";
import { ABACUS_PROGRAM_CARD_PALETTE, programCardPalette, withDefaultFeatureVideos } from "./marketingFeatureSections";

describe("programCardPalette", () => {
  it("cycles palette entries by index", () => {
    expect(programCardPalette(0)).toEqual(ABACUS_PROGRAM_CARD_PALETTE[0]);
    expect(programCardPalette(ABACUS_PROGRAM_CARD_PALETTE.length)).toEqual(ABACUS_PROGRAM_CARD_PALETTE[0]);
  });
});

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
    expect(out[0].videoUrl).toBeUndefined();
  });
});
