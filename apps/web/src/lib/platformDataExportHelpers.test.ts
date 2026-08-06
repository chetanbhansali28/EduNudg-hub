import { describe, expect, it } from "vitest";
import type { PlatformDataExportBundle } from "@/lib/platformDataExportApi";
import {
  buildBrandExportSheet,
  buildCenterExportSheet,
  buildPlatformExportSheets,
  buildStudentExportSheet,
  platformExportFilename,
  sheetToCsv,
} from "@/lib/platformDataExportHelpers";

const sampleBundle: PlatformDataExportBundle = {
  exportedAt: "2026-08-06T12:00:00.000Z",
  brands: [
    {
      id: "brand-1",
      slug: "spark-academy",
      name: "Spark Academy",
      status: "active",
      marketingTheme: "spark-academy",
      logoUrl: null,
      activeCenters: 2,
      subscriptionPlan: "Growth",
      subscriptionStatus: "active",
      subscriptionPeriodStart: "2026-01-01T00:00:00.000Z",
      subscriptionPeriodEnd: "2027-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  centers: [
    {
      id: "center-1",
      brandName: "Spark Academy",
      brandSlug: "spark-academy",
      slug: "downtown",
      name: "Downtown Center",
      displayName: "Spark Downtown",
      status: "active",
      region: "West",
      city: "Mumbai",
      country: "India",
      addressLine1: "123 Main St",
      pincode: "400001",
      contactPhone: "+91 90000 00000",
      shortDescription: "Flagship center",
      createdAt: "2025-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
  ],
  students: [
    {
      id: "student-1",
      brandName: "Spark Academy",
      brandSlug: "spark-academy",
      fullName: "Asha Kumar",
      studentCode: "SA-001",
      loginEmail: "asha@example.com",
      dateOfBirth: "2014-05-10",
      phone: "+91 91111 11111",
      addressLine1: "45 Park Lane",
      city: "Mumbai",
      state: "MH",
      pincode: "400002",
      schoolName: "City School",
      centerName: "Downtown Center",
      centerSlug: "downtown",
      enrollmentStatus: "active",
      programName: "Abacus",
      levelName: "Level 1",
      enrolledAt: "2026-03-01T00:00:00.000Z",
      enrollmentEndedAt: null,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "student-2",
      brandName: "Spark Academy",
      brandSlug: "spark-academy",
      fullName: "No Enrollment",
      studentCode: null,
      loginEmail: null,
      dateOfBirth: null,
      phone: null,
      addressLine1: null,
      city: null,
      state: null,
      pincode: null,
      schoolName: null,
      centerName: null,
      centerSlug: null,
      enrollmentStatus: null,
      programName: null,
      levelName: null,
      enrolledAt: null,
      enrollmentEndedAt: null,
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  ],
};

describe("platformDataExportHelpers", () => {
  it("buildBrandExportSheet includes subscription and center counts", () => {
    const sheet = buildBrandExportSheet(sampleBundle.brands);
    expect(sheet.headers).toContain("Active Centers");
    expect(sheet.rows[0]).toContain("2");
    expect(sheet.rows[0]).toContain("Growth");
  });

  it("buildCenterExportSheet includes brand and location fields", () => {
    const sheet = buildCenterExportSheet(sampleBundle.centers);
    expect(sheet.rows[0]).toContain("Spark Academy");
    expect(sheet.rows[0]).toContain("Mumbai");
  });

  it("buildStudentExportSheet emits one row per enrollment and one for unenrolled students", () => {
    const sheet = buildStudentExportSheet(sampleBundle.students);
    expect(sheet.rows).toHaveLength(2);
    expect(sheet.rows[0]).toContain("Asha Kumar");
    expect(sheet.rows[0]).toContain("Abacus");
    expect(sheet.rows[1]).toContain("No Enrollment");
    expect(sheet.rows[1]).toContain("");
  });

  it("buildPlatformExportSheets returns brands, centers, and students tabs", () => {
    const sheets = buildPlatformExportSheets(sampleBundle);
    expect(sheets.map((sheet) => sheet.name)).toEqual(["Brands", "Franchise Centers", "Students"]);
  });

  it("sheetToCsv escapes commas and quotes", () => {
    const csv = sheetToCsv({
      name: "Test",
      headers: ["Name"],
      rows: [['Say "hello", world']],
    });
    expect(csv).toContain('"Say ""hello"", world"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("platformExportFilename uses dated workbook name", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    expect(platformExportFilename(now, "xlsx")).toBe("edunudg-platform-export-2026-08-06.xlsx");
  });
});
