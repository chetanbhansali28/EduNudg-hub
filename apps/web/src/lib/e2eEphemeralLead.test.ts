import { describe, expect, it } from "vitest";
import {
  isE2EEphemeralLead,
  isE2EEphemeralLeadChildName,
  isE2EEphemeralLeadEmail,
  isE2EEphemeralLeadFullName,
  isE2EEphemeralLeadParentName,
} from "./e2eEphemeralLead";

describe("regression_e2eEphemeralLeadMatchers", () => {
  it("matches canonical and legacy E2E lead emails", () => {
    expect(isE2EEphemeralLeadEmail("e2e-lead-m1k2n3@example.com")).toBe(true);
    expect(isE2EEphemeralLeadEmail("path-a-9123456789@example.com")).toBe(true);
    expect(isE2EEphemeralLeadEmail("neg-pincode@example.com")).toBe(true);
    expect(isE2EEphemeralLeadEmail("parent@real-school.in")).toBe(false);
    expect(isE2EEphemeralLeadEmail("owner@edunudg.com")).toBe(false);
  });

  it("matches E2E parent and child name patterns without flagging ordinary names", () => {
    expect(isE2EEphemeralLeadParentName("E2E Parent m1k2n3")).toBe(true);
    expect(isE2EEphemeralLeadParentName("Path A Parent")).toBe(true);
    expect(isE2EEphemeralLeadParentName("Priya Sharma")).toBe(false);
    expect(isE2EEphemeralLeadChildName("E2E Child m1k2n3")).toBe(true);
    expect(isE2EEphemeralLeadChildName("CenterChild abc12")).toBe(true);
    expect(isE2EEphemeralLeadChildName("Child m1k2n3")).toBe(true);
    expect(isE2EEphemeralLeadChildName("Aarav")).toBe(false);
    expect(isE2EEphemeralLeadFullName("E2E Child m1k2n3")).toBe(true);
    expect(
      isE2EEphemeralLead({
        email: "e2e-lead-x@example.com",
        parent_name: "Someone",
        child_name: "Else",
      })
    ).toBe(true);
  });
});
