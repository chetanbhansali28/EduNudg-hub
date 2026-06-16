import { describe, expect, it } from "vitest";
import {
  assessmentVelocityHint,
  mergeReportSummary,
  pipelineConversionPercent,
  pipelineLeadTotal,
  reportAssessmentStatus,
  reportDesktopSubtitle,
  reportMobileSubtitle,
  reportQuarterLabel,
} from "./centerReportsHelpers";

describe("centerReportsHelpers", () => {
  it("computes pipeline totals and conversion", () => {
    expect(pipelineLeadTotal(1, 1)).toBe(2);
    expect(pipelineConversionPercent(1, 1)).toBe(50);
    expect(pipelineConversionPercent(0, 0)).toBe(0);
  });

  it("maps assessment status labels for mockup badges", () => {
    expect(reportAssessmentStatus(true, 85, 100)).toEqual({ label: "Passed", tone: "success" });
    expect(reportAssessmentStatus(false, 20, 100)).toEqual({ label: "Needs Review", tone: "warning" });
    expect(reportAssessmentStatus(null, 85, 100)).toEqual({ label: "Passed", tone: "success" });
  });

  it("builds mobile subtitle and quarter label", () => {
    expect(reportMobileSubtitle("Northside Learning Center", "88241abc-def0-1234-5678-90abcdef1234")).toContain(
      "Northside Learning Center"
    );
    expect(reportQuarterLabel(new Date("2024-08-15"))).toBe("Q3 2024");
  });

  it("regression_desktop_subtitle_matches_reports_copy", () => {
    expect(reportDesktopSubtitle()).toContain("operational health");
  });

  it("mergeReportSummary defaults to zero", () => {
    expect(mergeReportSummary(undefined)).toEqual({
      openLeads: 0,
      convertedLeads: 0,
      activeEnrollments: 0,
      assessments30d: 0,
    });
  });

  it("assessmentVelocityHint reflects activity", () => {
    expect(assessmentVelocityHint(4)).toContain("cadence");
    expect(assessmentVelocityHint(0)).toContain("No assessments");
  });
});
