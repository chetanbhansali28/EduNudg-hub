import { afterEach, describe, expect, it } from "vitest";
import { readAdminTheme, writeAdminTheme } from "@edunudg/ui";

describe("admin theme preference", () => {
  afterEach(() => {
    window.localStorage.removeItem("edunudg-admin-theme");
  });

  it("regression_defaults_to_light", () => {
    expect(readAdminTheme()).toBe("light");
  });

  it("regression_persists_admin_theme", () => {
    writeAdminTheme("dark");
    expect(readAdminTheme()).toBe("dark");
    writeAdminTheme("light");
    expect(readAdminTheme()).toBe("light");
  });

  it("regression_ignores_invalid_stored_value", () => {
    window.localStorage.setItem("edunudg-admin-theme", "sepia");
    expect(readAdminTheme()).toBe("light");
  });
});
