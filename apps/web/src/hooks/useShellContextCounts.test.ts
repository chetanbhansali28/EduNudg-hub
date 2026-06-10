import { describe, expect, it } from "vitest";
import { shellActionHints } from "./useShellContextCounts";

describe("shellActionHints", () => {
  it("returns brand actionable hints when counts are non-zero", () => {
    const hints = shellActionHints("brand", {
      pendingFranchiseApplications: 2,
      unassignedStudentLeads: 1,
      staleStudentLeads: 3,
      openCenterLeads: 0,
      staleCenterLeads: 0,
      pendingBrandSignups: 0,
    });
    expect(hints).toEqual([
      "2 franchise applications pending review",
      "1 unassigned student lead",
      "3 leads need attention",
    ]);
  });

  it("returns center and platform hints", () => {
    expect(
      shellActionHints("center", {
        pendingFranchiseApplications: 0,
        unassignedStudentLeads: 0,
        staleStudentLeads: 0,
        openCenterLeads: 4,
        staleCenterLeads: 1,
        pendingBrandSignups: 0,
      })
    ).toEqual(["4 open leads", "1 lead need attention"]);

    expect(
      shellActionHints("platform", {
        pendingFranchiseApplications: 0,
        unassignedStudentLeads: 0,
        staleStudentLeads: 0,
        openCenterLeads: 0,
        staleCenterLeads: 0,
        pendingBrandSignups: 1,
      })
    ).toEqual(["1 brand signup pending review"]);
  });

  it("returns empty hints when counts are zero", () => {
    expect(shellActionHints("brand", undefined)).toEqual([]);
  });
});
