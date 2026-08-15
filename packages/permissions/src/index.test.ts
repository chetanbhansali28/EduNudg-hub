import { describe, expect, it } from "vitest";
import { can } from "./index";

describe("can", () => {
  it("allows platform admin brand create", () => {
    expect(can("platform_super_admin", "brands", "create")).toBe(true);
  });

  it("denies center admissions brand suspend", () => {
    expect(can("center_admissions", "brands", "suspend")).toBe(false);
  });

  it("allows brand owner and brand admin to create centers", () => {
    expect(can("brand_owner", "centers", "create")).toBe(true);
    expect(can("brand_admin", "centers", "create")).toBe(true);
  });

  it("denies center staff franchise center create", () => {
    expect(can("center_owner", "centers", "create")).toBe(false);
  });
});
