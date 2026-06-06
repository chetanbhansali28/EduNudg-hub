import { describe, expect, it } from "vitest";
import {
  patchFromPlatformSettingForm,
  platformSettingDefinition,
  valuesFromPlatformSetting,
} from "./platformSettingsCatalog";

describe("platformSettingsCatalog", () => {
  it("regression_defaults_timezone_round_trip", () => {
    const def = platformSettingDefinition("defaults");
    expect(def).toBeDefined();
    const form = valuesFromPlatformSetting(def!, { timezone: "Asia/Kolkata", extra: true });
    expect(form.timezone).toBe("Asia/Kolkata");
    const patch = patchFromPlatformSettingForm(def!, { extra: true }, { timezone: "UTC" });
    expect(patch.timezone).toBe("UTC");
    expect(patch.extra).toBe(true);
  });
});
