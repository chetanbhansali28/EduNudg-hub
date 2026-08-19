import { describe, expect, it } from "vitest";
import {
  curriculumForStudent,
  studentMatchesSearch,
  type BrandStudentRow,
  type LevelCatalogRow,
  type StudentProgressRow,
} from "./brandStudentsApi";

const catalog: LevelCatalogRow[] = [
  { id: "l1", name: "Level 1", sort_order: 1, program_id: "p1", abacus_level_code: "L1" },
  { id: "l2", name: "Level 2", sort_order: 2, program_id: "p1", abacus_level_code: "L2" },
  { id: "l3", name: "Level 3", sort_order: 3, program_id: "p1", abacus_level_code: "L3" },
];

function student(overrides: Partial<BrandStudentRow> = {}): BrandStudentRow {
  return {
    id: "s1",
    enrollment_id: "e1",
    full_name: "Meera Sharma",
    student_code: "SBA-101",
    login_email: "meera@example.com",
    user_id: "u1",
    date_of_birth: "2014-05-12",
    photo_url: null,
    enrollment_status: "active",
    enrollment_created_at: "2026-01-10T00:00:00Z",
    program_id: "p1",
    program_name: "Abacus Core",
    starting_level_id: "l1",
    starting_level_name: "Level 1",
    current_level_id: "l2",
    current_level_name: "Level 2",
    levels: [],
    center_id: "c1",
    center_slug: "koramangala",
    center_name: "Abacus Koramangala",
    center_city: "Bengaluru",
    phone: "+919876543210",
    address_line1: "12 Main St",
    city: "Bengaluru",
    state: "KA",
    pincode: "560034",
    school_name: "Oakridge",
    parent_name: "Anita Sharma",
    parent_email: "anita@example.com",
    parent_phone: "+919900011111",
    batch_names: ["Morning A"],
    ...overrides,
  };
}

describe("brandStudentsApi", () => {
  it("studentMatchesSearch matches student name, franchise name, and city", () => {
    const row = student();
    expect(studentMatchesSearch(row, "meera")).toBe(true);
    expect(studentMatchesSearch(row, "Koramangala")).toBe(true);
    expect(studentMatchesSearch(row, "bengaluru")).toBe(true);
    expect(studentMatchesSearch(row, "SBA-101")).toBe(true);
    expect(studentMatchesSearch(row, "jayanagar")).toBe(false);
    expect(studentMatchesSearch(row, "")).toBe(true);
  });

  it("curriculumForStudent picks the first incomplete level as current", () => {
    const progress: StudentProgressRow[] = [
      { student_id: "s1", level_id: "l1", level_name: "Level 1", status: "completed" },
      { student_id: "s1", level_id: "l2", level_name: "Level 2", status: "in_progress" },
    ];
    const result = curriculumForStudent("s1", "p1", catalog, progress);
    expect(result.current_level_id).toBe("l2");
    expect(result.current_level_name).toBe("Level 2");
    expect(result.levels.map((level) => [level.name, level.status, level.is_current])).toEqual([
      ["Level 1", "completed", false],
      ["Level 2", "in_progress", true],
      ["Level 3", "not_started", false],
    ]);
  });

  it("curriculumForStudent treats all completed programs as completed", () => {
    const progress: StudentProgressRow[] = catalog.map((level) => ({
      student_id: "s1",
      level_id: level.id,
      level_name: level.name,
      status: "completed",
    }));
    const result = curriculumForStudent("s1", "p1", catalog, progress);
    expect(result.current_level_id).toBeNull();
    expect(result.current_level_name).toBe("Completed");
    expect(result.levels.every((level) => level.status === "completed")).toBe(true);
  });
});
