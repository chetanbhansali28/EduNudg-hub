import { describe, expect, it } from "vitest";
import { formatLoginAccessDeniedMessage } from "./loginAccessMessage";

describe("formatLoginAccessDeniedMessage", () => {
  it("includes email when present", () => {
    expect(formatLoginAccessDeniedMessage("nilgattani@gmail.com")).toBe(
      "nilgattani@gmail.com is not authorized for this website. Contact your administrator to request access."
    );
  });

  it("falls back when email missing", () => {
    expect(formatLoginAccessDeniedMessage(null)).toBe(
      "You are not authorized for this website. Contact your administrator to request access."
    );
  });
});
