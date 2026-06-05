import { describe, expect, it } from "vitest";
import { DELETE_CONFIRM_PHRASE, isDeleteConfirmed } from "./confirmDelete";

describe("confirmDelete", () => {
  it("accepts CONFIRM case-insensitively with surrounding whitespace", () => {
    expect(isDeleteConfirmed(DELETE_CONFIRM_PHRASE)).toBe(true);
    expect(isDeleteConfirmed(" confirm ")).toBe(true);
    expect(isDeleteConfirmed("confirm")).toBe(true);
  });

  it("rejects partial or empty input", () => {
    expect(isDeleteConfirmed("")).toBe(false);
    expect(isDeleteConfirmed("CONF")).toBe(false);
    expect(isDeleteConfirmed("CONFIRMED")).toBe(false);
  });
});
