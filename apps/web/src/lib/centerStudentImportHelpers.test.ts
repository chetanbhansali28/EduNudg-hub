import { describe, expect, it } from "vitest";
import { sanitizeImportCell } from "@/lib/franchiseCenterImportHelpers";
import {
  buildStudentImportRow,
  centerStudentImportTemplateCsv,
  parseCenterStudentImportCsv,
  summarizeStudentImportResult,
  toStudentImportRpcRow,
  validateStudentImportRow,
} from "./centerStudentImportHelpers";

describe("centerStudentImportHelpers", () => {
  it("parses a valid student import CSV", () => {
    const csv = `student_name,parent_name,whatsapp,email,city,pincode
Aarav Sharma,Priya Sharma,9876543210,priya@example.com,Pune,411001`;

    const preview = parseCenterStudentImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]?.student_name).toBe("Aarav Sharma");
    expect(preview.validRows[0]?.parent_name).toBe("Priya Sharma");
  });

  it("accepts child_name as an alias for student_name", () => {
    const csv = `child_name,parent_name,whatsapp
Aarav Sharma,Priya Sharma,9876543210`;

    const preview = parseCenterStudentImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows[0]?.student_name).toBe("Aarav Sharma");
  });

  it("requires student_name, parent_name, and whatsapp", () => {
    const csv = `student_name,parent_name,whatsapp
,,9876543210`;

    const preview = parseCenterStudentImportCsv(csv);
    expect(preview.validRows).toHaveLength(0);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/student_name/);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/parent_name/);
  });

  it("does not require parent email", () => {
    const errors = validateStudentImportRow(
      buildStudentImportRow({
        student_name: "Aarav",
        parent_name: "Priya",
        whatsapp: "9876543210",
      })
    );
    expect(errors).toEqual([]);
  });

  it("rejects invalid India pincode", () => {
    const errors = validateStudentImportRow(
      buildStudentImportRow({
        student_name: "Aarav",
        parent_name: "Priya",
        whatsapp: "9876543210",
        pincode: "12345",
      })
    );
    expect(errors[0]).toMatch(/pincode/);
  });

  it("sanitizes formula-injection prefixes", () => {
    expect(sanitizeImportCell("=SUM(1,1)", 200)).toBe("SUM(1,1)");
  });

  it("maps rows to RPC payload", () => {
    const row = buildStudentImportRow({
      student_name: "Aarav",
      parent_name: "Priya",
      whatsapp: "9876543210",
      school_name: "DPS",
      program_name: "Abacus",
    });
    expect(toStudentImportRpcRow(row)).toEqual({
      student_name: "Aarav",
      parent_name: "Priya",
      whatsapp: "9876543210",
      school_name: "DPS",
      program_name: "Abacus",
    });
  });

  it("summarizes created, skipped, and error counts", () => {
    expect(
      summarizeStudentImportResult({
        created: [{ row: 2, student_id: "a" }],
        skipped: [{ row: 3, student_id: "b", message: "Already enrolled" }],
        errors: [{ row: 4, message: "Invalid" }],
      })
    ).toBe("1 student imported. 1 already enrolled. 1 row failed.");
  });

  it("regression_sql_injection_in_student_name_is_plain_text", () => {
    const row = buildStudentImportRow({
      student_name: "'; DROP TABLE students;--",
      parent_name: "Parent",
      whatsapp: "9876543210",
    });
    expect(validateStudentImportRow(row)).toEqual([]);
    expect(toStudentImportRpcRow(row).student_name).toContain("DROP TABLE");
  });

  it("template includes required student import headers", () => {
    const csv = centerStudentImportTemplateCsv();
    expect(csv).toMatch(/student_name/);
    expect(csv).toMatch(/parent_name/);
    expect(csv).toMatch(/whatsapp/);
    expect(csv).toMatch(/Aarav Sharma/);
    expect(csv).not.toMatch(/student_code/);
    expect(csv).not.toMatch(/(^|,)phone(,|\n)/);
  });

  it("treats a phone column as whatsapp", () => {
    const csv = `student_name,parent_name,phone
Aarav Sharma,Priya Sharma,9876543210`;

    const preview = parseCenterStudentImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows[0]?.whatsapp).toBe("9876543210");
  });

  it("ignores leftover student_code columns", () => {
    const csv = `student_name,parent_name,whatsapp,student_code
Aarav Sharma,Priya Sharma,9876543210,SBA-001`;

    const preview = parseCenterStudentImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(toStudentImportRpcRow(preview.validRows[0]!)).not.toHaveProperty("student_code");
    expect(toStudentImportRpcRow(preview.validRows[0]!)).not.toHaveProperty("phone");
  });
});
