import { describe, expect, it } from "vitest";
import { sanitizeImportCell } from "@/lib/franchiseCenterImportHelpers";
import {
  buildLeadImportRow,
  parseCenterStudentLeadImportCsv,
  summarizeLeadImportResult,
  toLeadImportRpcRow,
  validateLeadImportRow,
} from "./centerStudentLeadImportHelpers";

describe("centerStudentLeadImportHelpers", () => {
  it("parses a valid center lead import CSV", () => {
    const csv = `parent_name,whatsapp,email,child_name,city,pincode
Priya Sharma,+919876543210,priya@example.com,Aarav Sharma,Pune,411001`;

    const preview = parseCenterStudentLeadImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]?.child_name).toBe("Aarav Sharma");
  });

  it("requires parent_name, whatsapp, and email", () => {
    const csv = `parent_name,whatsapp,email
, +919876543210,`;

    const preview = parseCenterStudentLeadImportCsv(csv);
    expect(preview.validRows).toHaveLength(0);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/parent_name/);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/email/);
  });

  it("rejects invalid India pincode", () => {
    const errors = validateLeadImportRow(
      buildLeadImportRow({
        parent_name: "Parent",
        whatsapp: "+919876543210",
        email: "parent@example.com",
        pincode: "12345",
      })
    );
    expect(errors[0]).toMatch(/pincode/);
  });

  it("sanitizes formula-injection prefixes", () => {
    expect(sanitizeImportCell("=SUM(1,1)", 200)).toBe("SUM(1,1)");
  });

  it("maps rows to RPC payload", () => {
    const row = buildLeadImportRow({
      parent_name: "Parent",
      whatsapp: "+919876543210",
      email: "parent@example.com",
      child_name: "Child",
    });
    expect(toLeadImportRpcRow(row)).toEqual({
      parent_name: "Parent",
      whatsapp: "919876543210",
      email: "parent@example.com",
      child_name: "Child",
    });
  });

  it("summarizes created, merged, and error counts", () => {
    expect(
      summarizeLeadImportResult({
        created: [{ row: 2, lead_id: "a" }],
        merged: [{ row: 3, lead_id: "b" }],
        errors: [{ row: 4, message: "Invalid" }],
      })
    ).toBe("1 lead created. 1 merged by WhatsApp. 1 row failed.");
  });

  it("regression_sql_injection_in_parent_name_is_plain_text", () => {
    const row = buildLeadImportRow({
      parent_name: "'; DROP TABLE leads;--",
      whatsapp: "+919876543210",
      email: "parent@example.com",
    });
    expect(validateLeadImportRow(row)).toEqual([]);
    expect(toLeadImportRpcRow(row).parent_name).toContain("DROP TABLE");
  });
});
