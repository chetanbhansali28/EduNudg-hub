import { describe, expect, it } from "vitest";
import type { BrandStudentRow } from "@/lib/brandStudentsApi";
import {
  brandStudentsCsvFilename,
  brandStudentsToCsv,
  filterBrandStudents,
  studentDirectoryMeta,
  studentPageCounts,
  studentStatusLabel,
} from "./brandStudentsHelpers";

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

describe("brandStudentsHelpers", () => {
  it("studentDirectoryMeta joins franchise name and city", () => {
    expect(studentDirectoryMeta(student())).toBe("Abacus Koramangala · Bengaluru");
  });

  it("studentPageCounts splits linked and unassigned", () => {
    const rows = [
      student(),
      student({ id: "s2", enrollment_id: "e2", user_id: null, program_id: null, full_name: "Arjun Rao" }),
    ];
    expect(studentPageCounts(rows)).toEqual({ total: 2, linked: 1, unassigned: 1 });
  });

  it("filterBrandStudents applies tab and search", () => {
    const rows = [
      student(),
      student({
        id: "s2",
        enrollment_id: "e2",
        full_name: "Arjun Rao",
        user_id: null,
        program_id: null,
        center_name: "Jayanagar",
        center_city: "Mysuru",
      }),
    ];
    expect(filterBrandStudents(rows, "linked", "").map((row) => row.id)).toEqual(["s1"]);
    expect(filterBrandStudents(rows, "unassigned", "").map((row) => row.id)).toEqual(["s2"]);
    expect(filterBrandStudents(rows, "all", "mysuru").map((row) => row.id)).toEqual(["s2"]);
    expect(filterBrandStudents(rows, "all", "jayanagar")).toHaveLength(1);
  });

  it("studentStatusLabel marks unassigned programs", () => {
    expect(studentStatusLabel(student())).toBe("LINKED");
    expect(studentStatusLabel(student({ user_id: null }))).toBe("ACTIVE");
    expect(studentStatusLabel(student({ program_id: null }))).toBe("UNASSIGNED");
  });

  it("regression_brand_students_csv_includes_every_enrollment", () => {
    const csv = brandStudentsToCsv([
      student(),
      student({
        id: "s2",
        enrollment_id: "e2",
        full_name: 'Arjun "AJ" Rao',
        student_code: "SBA-202",
        user_id: null,
        program_id: null,
        program_name: null,
        parent_name: "Rao, Kiran",
        center_name: "Jayanagar",
        center_slug: "jayanagar",
        center_city: "Mysuru",
        batch_names: [],
      }),
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("student_code,student_name,parent_name");
    expect(csv).toContain("SBA-101,Meera Sharma");
    expect(csv).toContain('"Arjun ""AJ"" Rao"');
    expect(csv).toContain('"Rao, Kiran"');
    expect(csv).toContain("jayanagar,Mysuru,active,no");
    expect(csv).toContain("Abacus Koramangala,koramangala,Bengaluru,active,yes");
  });

  it("regression_brand_students_csv_filename_uses_brand_slug", () => {
    expect(brandStudentsCsvFilename("smart-brain-abacus", new Date("2026-08-17T06:00:00Z"))).toBe(
      "smart-brain-abacus-students-2026-08-17.csv"
    );
  });
});
