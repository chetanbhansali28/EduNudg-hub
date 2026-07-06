import { describe, expect, it } from "vitest";
import { formatSettingsUpdated, normalizeStaleLeadDays } from "./brandSettingsHelpers";

describe("brandSettingsHelpers", () => {
  it("formats settings updated label", () => {
    const now = new Date("2026-06-22T12:00:00Z").getTime();
    expect(formatSettingsUpdated("2026-06-22T10:00:00Z", now)).toBe("Last updated 2 hours ago by Admin");
  });

  it("normalizes stale lead days", () => {
    expect(normalizeStaleLeadDays("7")).toBe(7);
    expect(normalizeStaleLeadDays("0")).toBe(15);
  });
});
