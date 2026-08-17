import { describe, expect, it, vi } from "vitest";
import {
  filterCenterStudents,
  studentPageCounts,
  studentProfileLoginUrl,
  studentProgramLabel,
} from "./centerStudentsHelpers";
import type { CenterStudentRow } from "./centerStudentsApi";

const sample = (overrides: Partial<CenterStudentRow> = {}): CenterStudentRow => ({
  id: "student-1",
  full_name: "Aarav Sharma",
  student_code: "STU-001",
  login_email: "aarav@example.com",
  parent_email: "parent@example.com",
  user_id: "user-1",
  enrollment_id: "enr-1",
  enrollment_status: "active",
  enrollment_created_at: "2026-01-01T00:00:00Z",
  program_id: "prog-1",
  program_name: "Abacus",
  starting_level_id: "lvl-1",
  starting_level_name: "Level 1",
  batch_ids: ["batch-1"],
  batch_names: ["Morning"],
  ...overrides,
});

describe("centerStudentsHelpers", () => {
  it("studentProgramLabel includes level when present", () => {
    expect(studentProgramLabel(sample())).toBe("Abacus · Level 1");
    expect(studentProgramLabel(sample({ starting_level_name: null }))).toBe("Abacus");
    expect(studentProgramLabel(sample({ program_name: null, starting_level_name: null }))).toBe("Not assigned");
  });

  it("studentPageCounts splits linked unassigned and programs", () => {
    const counts = studentPageCounts([
      sample(),
      sample({
        id: "student-2",
        user_id: null,
        program_id: null,
        program_name: null,
        batch_ids: [],
        batch_names: [],
      }),
    ]);
    expect(counts).toEqual({ linked: 1, unassigned: 1, programs: 1, total: 2 });
  });

  it("filterCenterStudents applies tab and search", () => {
    const rows = [
      sample(),
      sample({
        id: "student-2",
        full_name: "Meera Reddy",
        student_code: "STU-002",
        user_id: null,
        batch_ids: [],
        batch_names: [],
      }),
    ];
    expect(filterCenterStudents(rows, "linked", "").map((row) => row.id)).toEqual(["student-1"]);
    expect(filterCenterStudents(rows, "unassigned", "").map((row) => row.id)).toEqual(["student-2"]);
    expect(filterCenterStudents(rows, "all", "meera")).toHaveLength(1);
  });

  it("regression_student_profile_login_url_is_learn_portal_without_password", () => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "smart-brain-abacus.smart-brain-abacus.localhost", port: "9000" },
    });
    const url = studentProfileLoginUrl("smart-brain-abacus");
    expect(url).toBe("http://learn.smart-brain-abacus.localhost:9000/login");
    expect(url).not.toMatch(/password/i);
    vi.unstubAllGlobals();
  });
});
