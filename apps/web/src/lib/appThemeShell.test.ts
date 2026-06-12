import { describe, expect, it } from "vitest";
import { shouldUseAdminThemeProvider } from "./appThemeShell";

describe("shouldUseAdminThemeProvider", () => {
  it("skips theme provider on center public homepage and login", () => {
    expect(shouldUseAdminThemeProvider({ portalType: "center" }, "/")).toBe(false);
    expect(shouldUseAdminThemeProvider({ portalType: "center" }, "/login")).toBe(false);
  });

  it("uses theme provider on center staff app and learn student dashboard", () => {
    expect(shouldUseAdminThemeProvider({ portalType: "center" }, "/app")).toBe(true);
    expect(shouldUseAdminThemeProvider({ portalType: "learn" }, "/")).toBe(true);
    expect(shouldUseAdminThemeProvider({ portalType: "learn" }, "/login")).toBe(true);
  });
});
