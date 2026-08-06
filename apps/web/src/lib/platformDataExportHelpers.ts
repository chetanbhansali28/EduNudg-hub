import type {
  PlatformBrandExportRow,
  PlatformCenterExportRow,
  PlatformDataExportBundle,
  PlatformStudentExportRow,
} from "@/lib/platformDataExportApi";

export type PlatformExportSheet = {
  name: string;
  headers: string[];
  rows: string[][];
};

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowValues(values: (string | number | null | undefined)[]): string[] {
  return values.map((value) => (value == null ? "" : String(value)));
}

export function buildBrandExportSheet(brands: PlatformBrandExportRow[]): PlatformExportSheet {
  return {
    name: "Brands",
    headers: [
      "Brand ID",
      "Slug",
      "Name",
      "Status",
      "Marketing Theme",
      "Logo URL",
      "Active Centers",
      "Subscription Plan",
      "Subscription Status",
      "Subscription Period Start",
      "Subscription Period End",
      "Created At",
      "Updated At",
    ],
    rows: brands.map((brand) =>
      rowValues([
        brand.id,
        brand.slug,
        brand.name,
        brand.status,
        brand.marketingTheme,
        brand.logoUrl,
        brand.activeCenters,
        brand.subscriptionPlan,
        brand.subscriptionStatus,
        brand.subscriptionPeriodStart,
        brand.subscriptionPeriodEnd,
        brand.createdAt,
        brand.updatedAt,
      ])
    ),
  };
}

export function buildCenterExportSheet(centers: PlatformCenterExportRow[]): PlatformExportSheet {
  return {
    name: "Franchise Centers",
    headers: [
      "Center ID",
      "Brand Name",
      "Brand Slug",
      "Center Slug",
      "Name",
      "Display Name",
      "Status",
      "Region",
      "City",
      "Country",
      "Address",
      "Pincode",
      "Contact Phone",
      "Short Description",
      "Created At",
      "Updated At",
    ],
    rows: centers.map((center) =>
      rowValues([
        center.id,
        center.brandName,
        center.brandSlug,
        center.slug,
        center.name,
        center.displayName,
        center.status,
        center.region,
        center.city,
        center.country,
        center.addressLine1,
        center.pincode,
        center.contactPhone,
        center.shortDescription,
        center.createdAt,
        center.updatedAt,
      ])
    ),
  };
}

export function buildStudentExportSheet(students: PlatformStudentExportRow[]): PlatformExportSheet {
  return {
    name: "Students",
    headers: [
      "Student ID",
      "Brand Name",
      "Brand Slug",
      "Full Name",
      "Student Code",
      "Login Email",
      "Date of Birth",
      "Phone",
      "Address",
      "City",
      "State",
      "Pincode",
      "School Name",
      "Center Name",
      "Center Slug",
      "Enrollment Status",
      "Program",
      "Starting Level",
      "Enrolled At",
      "Enrollment Ended At",
      "Created At",
      "Updated At",
    ],
    rows: students.map((student) =>
      rowValues([
        student.id,
        student.brandName,
        student.brandSlug,
        student.fullName,
        student.studentCode,
        student.loginEmail,
        student.dateOfBirth,
        student.phone,
        student.addressLine1,
        student.city,
        student.state,
        student.pincode,
        student.schoolName,
        student.centerName,
        student.centerSlug,
        student.enrollmentStatus,
        student.programName,
        student.levelName,
        student.enrolledAt,
        student.enrollmentEndedAt,
        student.createdAt,
        student.updatedAt,
      ])
    ),
  };
}

export function buildPlatformExportSheets(bundle: PlatformDataExportBundle): PlatformExportSheet[] {
  return [
    buildBrandExportSheet(bundle.brands),
    buildCenterExportSheet(bundle.centers),
    buildStudentExportSheet(bundle.students),
  ];
}

export function sheetToCsv(sheet: PlatformExportSheet): string {
  const lines = [sheet.headers.map(escapeCsvCell).join(","), ...sheet.rows.map((row) => row.map(escapeCsvCell).join(","))];
  return `\uFEFF${lines.join("\n")}`;
}

export function platformExportFilename(now = new Date(), ext: "xlsx" | "csv"): string {
  const stamp = now.toISOString().slice(0, 10);
  return ext === "xlsx" ? `edunudg-platform-export-${stamp}.xlsx` : `edunudg-platform-export-${stamp}.csv`;
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadPlatformDataWorkbook(bundle: PlatformDataExportBundle, now = new Date()): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheet of buildPlatformExportSheets(bundle)) {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Exported At", bundle.exportedAt],
    ["Brand Count", bundle.brands.length],
    ["Franchise Center Count", bundle.centers.length],
    ["Student Row Count", bundle.students.length],
  ]);
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Summary");

  XLSX.writeFile(workbook, platformExportFilename(now, "xlsx"));
}

export function downloadPlatformDataCsvBundle(bundle: PlatformDataExportBundle, now = new Date()): void {
  const stamp = now.toISOString().slice(0, 10);
  for (const sheet of buildPlatformExportSheets(bundle)) {
    const slug = sheet.name.toLowerCase().replace(/\s+/g, "-");
    downloadTextFile(sheetToCsv(sheet), `edunudg-${slug}-${stamp}.csv`, "text/csv;charset=utf-8");
  }
}

export async function exportPlatformData(format: "xlsx" | "csv" = "xlsx"): Promise<void> {
  const { fetchPlatformDataExport } = await import("@/lib/platformDataExportApi");
  const bundle = await fetchPlatformDataExport();
  if (format === "csv") {
    downloadPlatformDataCsvBundle(bundle);
    return;
  }
  await downloadPlatformDataWorkbook(bundle);
}
