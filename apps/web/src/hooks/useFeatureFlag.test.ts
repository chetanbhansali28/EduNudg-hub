import { describe, expect, it } from "vitest";
import { FEATURE_FLAG_DEFAULTS, resolveFeatureFlags } from "@/hooks/useFeatureFlag";

describe("resolveFeatureFlags", () => {
  it("uses stored value when present", () => {
    expect(resolveFeatureFlags({ campaigns: true }, "campaigns")).toBe(true);
  });

  it("regression_falls_back_to_defaults", () => {
    expect(resolveFeatureFlags({}, "student_leads")).toBe(FEATURE_FLAG_DEFAULTS.student_leads);
    expect(resolveFeatureFlags(undefined, "kits")).toBe(false);
  });
});
