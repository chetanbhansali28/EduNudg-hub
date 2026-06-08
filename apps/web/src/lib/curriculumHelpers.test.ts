import { describe, expect, it } from "vitest";
import {
  getPublishLabel,
  parseTopicsComma,
  pickPublishedVersion,
  pickWorkingVersion,
  publishLabelText,
  topicsToString,
} from "./curriculumHelpers";

describe("curriculumHelpers", () => {
  const versions = [
    { id: "v2", program_id: "p1", version_number: 2, status: "draft" as const },
    { id: "v1", program_id: "p1", version_number: 1, status: "published" as const },
  ];

  it("pickWorkingVersion prefers latest draft", () => {
    expect(pickWorkingVersion(versions)?.id).toBe("v2");
  });

  it("pickWorkingVersion falls back to published when no draft", () => {
    const onlyPublished = [{ id: "v1", program_id: "p1", version_number: 1, status: "published" as const }];
    expect(pickWorkingVersion(onlyPublished)?.id).toBe("v1");
  });

  it("pickPublishedVersion returns highest published version", () => {
    expect(pickPublishedVersion(versions)?.id).toBe("v1");
  });

  it("getPublishLabel distinguishes live vs draft with live", () => {
    expect(getPublishLabel(versions[0], versions[1])).toBe("draft_with_live");
    expect(getPublishLabel(versions[1], versions[1])).toBe("live");
    expect(publishLabelText("draft_with_live")).toMatch(/not yet live/i);
  });

  it("parseTopicsComma and topicsToString round-trip", () => {
    expect(parseTopicsComma("A, B ,C")).toEqual(["A", "B", "C"]);
    expect(topicsToString(["Finger basics", "Small friends"])).toBe("Finger basics, Small friends");
  });
});
