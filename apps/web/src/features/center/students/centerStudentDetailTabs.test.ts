import { describe, expect, it } from "vitest";
import { parseCenterStudentDetailTab } from "./centerStudentDetailTabs";

describe("centerStudentDetailTabs", () => {
  it("regression_parse_assessments_tab_from_query", () => {
    expect(parseCenterStudentDetailTab("assessments")).toBe("assessments");
    expect(parseCenterStudentDetailTab("enrollment")).toBe("enrollment");
    expect(parseCenterStudentDetailTab(null)).toBe("enrollment");
  });
});
