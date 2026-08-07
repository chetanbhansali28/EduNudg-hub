import { describe, expect, it } from "vitest";
import { resolveLeadModalKind } from "./resolveLeadModalKind";

describe("resolveLeadModalKind", () => {
  it("maps enroll and apply hrefs", () => {
    expect(resolveLeadModalKind("enroll")).toBe("enroll");
    expect(resolveLeadModalKind("#apply")).toBe("apply");
  });

  it("regression_deep_link_aliases_open_enroll_modal", () => {
    expect(resolveLeadModalKind("#enroll-student")).toBe("enroll");
    expect(resolveLeadModalKind("enroll-student")).toBe("enroll");
    expect(resolveLeadModalKind("#register")).toBe("enroll");
    expect(resolveLeadModalKind("register")).toBe("enroll");
  });

  it("returns null for regular links", () => {
    expect(resolveLeadModalKind("#faq")).toBeNull();
  });
});
