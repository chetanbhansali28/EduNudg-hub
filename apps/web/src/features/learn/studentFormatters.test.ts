import { describe, expect, it } from "vitest";
import { studentGreeting, studentInitials } from "@/features/learn/studentFormatters";

describe("studentFormatters", () => {
  it("studentInitials uses first and last name", () => {
    expect(studentInitials("Asha Kumar")).toBe("AK");
  });

  it("studentGreeting includes first name", () => {
    expect(studentGreeting("Asha Kumar")).toMatch(/Asha$/);
  });
});
