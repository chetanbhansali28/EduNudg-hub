import { describe, expect, it } from "vitest";
import { assessmentResultLabel, levelStatusLabel, studentGreeting, studentInitials } from "@/features/learn/studentFormatters";

describe("studentFormatters", () => {
  it("levelStatusLabel maps failed to Fail", () => {
    expect(levelStatusLabel("failed")).toBe("Fail");
    expect(levelStatusLabel("completed")).toBe("Completed");
  });

  it("assessmentResultLabel maps pass and fail", () => {
    expect(assessmentResultLabel(true)).toBe("Pass");
    expect(assessmentResultLabel(false)).toBe("Fail");
    expect(assessmentResultLabel(null)).toBeNull();
  });

  it("studentInitials uses first and last name", () => {
    expect(studentInitials("Asha Kumar")).toBe("AK");
  });

  it("studentGreeting includes first name", () => {
    expect(studentGreeting("Asha Kumar")).toMatch(/Asha$/);
  });
});
