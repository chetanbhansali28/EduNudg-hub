import { describe, expect, it } from "vitest";
import { can } from "./index";

describe("can", () => {
  it("allows platform admin brand create", () => {
    expect(can("platform_super_admin", "brands", "create")).toBe(true);
  });

  it("denies center admissions brand suspend", () => {
    expect(can("center_admissions", "brands", "suspend")).toBe(false);
  });
});
