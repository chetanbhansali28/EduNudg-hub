import { describe, expect, it } from "vitest";
import { formatLastSavedLabel, formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  it("regression_format_last_saved_label", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const label = formatLastSavedLabel(twoHoursAgo);
    expect(label).toMatch(/^Last saved:/);
    expect(formatRelativeTime(twoHoursAgo)).toMatch(/hour/i);
  });

  it("returns null for missing timestamp", () => {
    expect(formatLastSavedLabel(null)).toBeNull();
    expect(formatLastSavedLabel(undefined)).toBeNull();
  });
});
