import { describe, expect, it } from "vitest";
import { staffAuthPasswordError } from "./staffAuthPassword";

describe("staffAuthPasswordError", () => {
  it("regression_admin_password_is_too_short_for_auth", () => {
    expect(staffAuthPasswordError("admin")).toMatch(/at least 6 characters/i);
    expect(staffAuthPasswordError("admin1")).toBeNull();
    expect(staffAuthPasswordError("")).toBeNull();
    expect(staffAuthPasswordError(undefined)).toBeNull();
  });
});
