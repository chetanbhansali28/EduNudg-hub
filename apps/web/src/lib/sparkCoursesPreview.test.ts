import { describe, expect, it } from "vitest";
import {
  SPARK_COURSES_PREVIEW_FALLBACK,
  sparkCoursesHomepagePreviewLimit,
} from "./sparkCoursesPreview";

describe("sparkCoursesHomepagePreviewLimit", () => {
  it("falls back to a desktop row when width is unknown", () => {
    expect(sparkCoursesHomepagePreviewLimit(0)).toBe(SPARK_COURSES_PREVIEW_FALLBACK);
    expect(sparkCoursesHomepagePreviewLimit(-1)).toBe(3);
  });

  it("matches Spark flex wrap at typical viewports", () => {
    expect(sparkCoursesHomepagePreviewLimit(335)).toBe(1);
    expect(sparkCoursesHomepagePreviewLimit(728)).toBe(2);
    expect(sparkCoursesHomepagePreviewLimit(1160)).toBe(3);
  });
});
