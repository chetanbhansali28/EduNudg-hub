import { describe, expect, it } from "vitest";
import type { StudentAssessmentRow } from "./centerAssessmentsApi";
import {
  assessmentScoreLabel,
  assessmentStudentName,
  latestAssessmentForLevel,
  matchesAssessmentFilter,
  matchesAssessmentSearch,
  passFailLabel,
  programLevelsForAssessment,
  unrecordedProgramLevels,
} from "./centerAssessmentsHelpers";

const sampleRow = (overrides: Partial<StudentAssessmentRow> = {}): StudentAssessmentRow => ({
  id: "a1",
  student_id: "s1",
  assessment_type: "level_check",
  score: 85,
  max_score: 100,
  assessed_at: "2026-01-15T10:00:00Z",
  notes: "Strong performance",
  passed: true,
  level_id: "l1",
  program_id: "p1",
  students: { full_name: "Alex Student" },
  levels: { name: "Level 2" },
  programs: { name: "Abacus Basics" },
  ...overrides,
});

describe("centerAssessmentsHelpers", () => {
  it("formats student name and pass/fail labels", () => {
    expect(assessmentStudentName(sampleRow())).toBe("Alex Student");
    expect(passFailLabel(true)).toBe("Pass");
    expect(passFailLabel(false)).toBe("Fail");
    expect(passFailLabel(null)).toBe("Pending");
  });

  it("formats score label", () => {
    expect(assessmentScoreLabel(sampleRow())).toBe("85 / 100");
    expect(assessmentScoreLabel(sampleRow({ score: null }))).toBe("No score recorded");
  });

  it("matches search and filter", () => {
    const row = sampleRow();
    expect(matchesAssessmentSearch(row, "alex")).toBe(true);
    expect(matchesAssessmentSearch(row, "unknown")).toBe(false);
    expect(matchesAssessmentFilter(row, "pass")).toBe(true);
    expect(matchesAssessmentFilter(row, "fail")).toBe(false);
    expect(matchesAssessmentFilter(sampleRow({ passed: false }), "fail")).toBe(true);
  });

  it("lists unrecorded program levels for assessment type dropdown", () => {
    const ctx = {
      enrollment_id: "e1",
      program_id: "p1",
      program_name: "Abacus Basics",
      starting_level_id: "l1",
      starting_level_name: "Level 1",
      current_level_id: "l2",
      current_level_name: "Level 2",
      levels: [
        { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", abacus_level_code: "L1" },
        { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", abacus_level_code: "L2" },
        { level_id: "l3", name: "Level 3", sort_order: 3, status: "not_started", abacus_level_code: null },
      ],
    };
    const recorded = [sampleRow({ level_id: "l1" })];
    expect(unrecordedProgramLevels(ctx, recorded)).toEqual([
      { level_id: "l2", label: "Abacus Basics · Level 2 (L2)", sort_order: 2 },
      { level_id: "l3", label: "Abacus Basics · Level 3", sort_order: 3 },
    ]);
  });

  it("lists all program levels and finds latest assessment per level", () => {
    const ctx = {
      enrollment_id: "e1",
      program_id: "p1",
      program_name: "Abacus Basics",
      starting_level_id: "l1",
      starting_level_name: "Level 1",
      current_level_id: "l2",
      current_level_name: "Level 2",
      levels: [
        { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", abacus_level_code: "L1" },
        { level_id: "l2", name: "Level 2", sort_order: 2, status: "failed", abacus_level_code: "L2" },
      ],
    };
    expect(programLevelsForAssessment(ctx)).toEqual([
      { level_id: "l1", label: "Abacus Basics · Level 1 (L1)", sort_order: 1 },
      { level_id: "l2", label: "Abacus Basics · Level 2 (L2)", sort_order: 2 },
    ]);

    const rows = [
      sampleRow({ id: "a2", level_id: "l2", passed: false, assessed_at: "2026-02-02T10:00:00Z" }),
      sampleRow({ id: "a1", level_id: "l2", passed: true, assessed_at: "2026-01-15T10:00:00Z" }),
    ];
    expect(latestAssessmentForLevel(rows, "l2")?.id).toBe("a2");
    expect(latestAssessmentForLevel(rows, "l3")).toBeNull();
  });
});
