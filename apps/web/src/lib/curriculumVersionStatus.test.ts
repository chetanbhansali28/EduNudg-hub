import { describe, expect, it } from "vitest";
import { versionPublishValue } from "./curriculumVersionStatus";

describe("versionPublishValue", () => {
  it("regression_maps_archived_versions_to_draft_toggle", () => {
    expect(versionPublishValue("archived")).toBe("draft");
  });

  it("regression_keeps_published_toggle_value", () => {
    expect(versionPublishValue("published")).toBe("published");
  });
});
