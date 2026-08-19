import { describe, expect, it } from "vitest";
import { can, canAny } from "./index";

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

  it("allows brand owner to delete and suspend centers", () => {
    expect(can("brand_owner", "centers", "delete")).toBe(true);
    expect(can("brand_admin", "centers", "suspend")).toBe(true);
    expect(can("center_owner", "centers", "delete")).toBe(false);
  });

  it("allows brand owner and admin to manage competitions", () => {
    expect(can("brand_owner", "competitions", "create")).toBe(true);
    expect(can("brand_admin", "competitions", "update")).toBe(true);
    expect(can("center_owner", "competitions", "read")).toBe(true);
    expect(can("center_owner", "competitions", "create")).toBe(false);
  });

  it("regression_platformAdminCanCreateCompetitions", () => {
    expect(can("platform_super_admin", "competitions", "create")).toBe(true);
    expect(can("platform_ops", "competitions", "update")).toBe(true);
    expect(can("platform_super_admin", "competitions", "delete")).toBe(true);
    expect(canAny(["platform_super_admin"], "competitions", "create")).toBe(true);
    expect(canAny(["center_owner"], "competitions", "create")).toBe(false);
  });

  it("allows brand owner and admin to read enrollments", () => {
    expect(can("brand_owner", "enrollments", "read")).toBe(true);
    expect(can("brand_admin", "enrollments", "read")).toBe(true);
    expect(can("brand_admin", "enrollments", "create")).toBe(false);
  });

  it("allows brand owner and admin to update programs", () => {
    expect(can("brand_owner", "programs", "update")).toBe(true);
    expect(can("brand_admin", "programs", "update")).toBe(true);
    expect(can("center_owner", "programs", "update")).toBe(false);
  });
});
