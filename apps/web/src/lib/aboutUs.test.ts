import { describe, expect, it } from "vitest";
import {
  aboutHasContent,
  defaultAboutSection,
  isAboutPagePublished,
  mergeAboutSection,
} from "./aboutUs";

describe("aboutUs", () => {
  it("defaultAboutSection_includes_mastermind_style_structure", () => {
    const about = defaultAboutSection("BrightMind");
    expect(about.title).toContain("BRIGHTMIND");
    expect(about.features).toHaveLength(4);
    expect(about.publishPage).toBe(true);
    expect(about.members).toEqual([]);
  });

  it("aboutHasContent_requires_meaningful_fields", () => {
    expect(aboutHasContent(undefined)).toBe(false);
    expect(aboutHasContent({ features: [], members: [] })).toBe(false);
    expect(aboutHasContent({ title: "About us", features: [], members: [] })).toBe(true);
    expect(
      aboutHasContent({
        features: [{ id: "1", title: "Research", body: "" }],
        members: [],
      })
    ).toBe(true);
  });

  it("isAboutPagePublished_respects_publish_flag", () => {
    const about = defaultAboutSection("X");
    expect(isAboutPagePublished(about)).toBe(true);
    expect(isAboutPagePublished({ ...about, publishPage: false })).toBe(false);
    expect(isAboutPagePublished({ features: [], members: [], publishPage: true })).toBe(false);
  });

  it("mergeAboutSection_keeps_custom_members_and_features", () => {
    const merged = mergeAboutSection("Brand", {
      title: "Custom",
      features: [{ id: "a", title: "A", body: "B" }],
      members: [{ id: "m1", name: "Naveen", role: "Director", photoUrl: "https://example.com/a.jpg" }],
      publishPage: true,
    });
    expect(merged.title).toBe("Custom");
    expect(merged.features).toHaveLength(1);
    expect(merged.members[0]?.name).toBe("Naveen");
  });
});
