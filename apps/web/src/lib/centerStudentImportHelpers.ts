import { downloadTextFile } from "@/lib/platformDataExportHelpers";
import { isIndiaPincode } from "@/lib/leadSla";
import {
  FRANCHISE_CENTER_IMPORT_MAX_BYTES,
  FRANCHISE_CENTER_IMPORT_MAX_ROWS,
  parseCsvText,
  readImportCsvFile,
  sanitizeImportCell,
  validateImportFile,
} from "@/lib/franchiseCenterImportHelpers";

export const CENTER_STUDENT_IMPORT_MAX_BYTES = FRANCHISE_CENTER_IMPORT_MAX_BYTES;
export const CENTER_STUDENT_IMPORT_MAX_ROWS = FRANCHISE_CENTER_IMPORT_MAX_ROWS;

export type CenterStudentImportField =
  | "student_name"
  | "parent_name"
  | "whatsapp"
  | "email"
  | "student_dob"
  | "login_email"
  | "school_name"
  | "address_line1"
  | "city"
  | "state"
  | "pincode"
  | "program_name"
  | "starting_level";

export type CenterStudentImportRow = Record<CenterStudentImportField, string>;

export type ParsedCenterStudentImportRow = {
  rowNumber: number;
  values: Partial<CenterStudentImportRow>;
  errors: string[];
};

export type CenterStudentImportPreview = {
  rows: ParsedCenterStudentImportRow[];
  validRows: CenterStudentImportRow[];
  fileError: string | null;
};

export type CenterStudentImportRpcRow = {
  student_name: string;
  parent_name: string;
  whatsapp: string;
  email?: string;
  student_dob?: string;
  login_email?: string;
  school_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  program_name?: string;
  starting_level?: string;
};

const TEMPLATE_HEADERS: CenterStudentImportField[] = [
  "student_name",
  "parent_name",
  "whatsapp",
  "email",
  "student_dob",
  "login_email",
  "school_name",
  "address_line1",
  "city",
  "state",
  "pincode",
  "program_name",
  "starting_level",
];

const HEADER_ALIASES: Record<string, CenterStudentImportField> = {
  student_name: "student_name",
  "student name": "student_name",
  student: "student_name",
  child_name: "student_name",
  "child name": "student_name",
  name: "student_name",
  parent_name: "parent_name",
  "parent name": "parent_name",
  parent: "parent_name",
  whatsapp: "whatsapp",
  "whatsapp number": "whatsapp",
  parent_whatsapp: "whatsapp",
  phone: "whatsapp",
  "parent phone": "whatsapp",
  "parent whatsapp": "whatsapp",
  "profile phone": "whatsapp",
  "student phone": "whatsapp",
  email: "email",
  "parent email": "email",
  student_dob: "student_dob",
  "student dob": "student_dob",
  child_dob: "student_dob",
  "child dob": "student_dob",
  dob: "student_dob",
  "date of birth": "student_dob",
  login_email: "login_email",
  "login email": "login_email",
  "student email": "login_email",
  school_name: "school_name",
  "school name": "school_name",
  address_line1: "address_line1",
  address: "address_line1",
  "address line 1": "address_line1",
  city: "city",
  state: "state",
  pincode: "pincode",
  program_name: "program_name",
  "program name": "program_name",
  program: "program_name",
  course: "program_name",
  starting_level: "starting_level",
  "starting level": "starting_level",
  level: "starting_level",
};

const SAMPLE_ROW: CenterStudentImportRow = {
  student_name: "Aarav Sharma",
  parent_name: "Priya Sharma",
  whatsapp: "9876543210",
  email: "priya@example.com",
  student_dob: "2015-03-15",
  login_email: "aarav.sharma@example.com",
  school_name: "Delhi Public School",
  address_line1: "12 MG Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  program_name: "Abacus Level 1",
  starting_level: "Level 1",
};

const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;

export function normalizeStudentImportHeader(header: string): CenterStudentImportField | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

export function buildStudentImportRow(values: Partial<CenterStudentImportRow>): CenterStudentImportRow {
  return {
    student_name: sanitizeImportCell(values.student_name ?? "", 200),
    parent_name: sanitizeImportCell(values.parent_name ?? "", 200),
    whatsapp: sanitizeImportCell(values.whatsapp ?? "", 32),
    email: sanitizeImportCell(values.email ?? "", 320).toLowerCase(),
    student_dob: sanitizeImportCell(values.student_dob ?? "", 32),
    login_email: sanitizeImportCell(values.login_email ?? "", 320).toLowerCase(),
    school_name: sanitizeImportCell(values.school_name ?? "", 200),
    address_line1: sanitizeImportCell(values.address_line1 ?? "", 500),
    city: sanitizeImportCell(values.city ?? "", 100),
    state: sanitizeImportCell(values.state ?? "", 100),
    pincode: sanitizeImportCell(values.pincode ?? "", 12),
    program_name: sanitizeImportCell(values.program_name ?? "", 200),
    starting_level: sanitizeImportCell(values.starting_level ?? "", 120),
  };
}

export function validateStudentImportRow(values: Partial<CenterStudentImportRow>): string[] {
  const errors: string[] = [];
  const built = buildStudentImportRow(values);
  const pincode = built.pincode.trim();

  if (!built.student_name.trim()) errors.push("student_name is required.");
  if (!built.parent_name.trim()) errors.push("parent_name is required.");
  if (!built.whatsapp.trim()) errors.push("whatsapp is required.");

  if (built.email.trim() && !EMAIL_PATTERN.test(built.email)) {
    errors.push("email is not valid.");
  }
  if (built.login_email.trim() && !EMAIL_PATTERN.test(built.login_email)) {
    errors.push("login_email is not valid.");
  }
  if (pincode && !isIndiaPincode(pincode)) {
    errors.push("pincode must be a 6-digit India pincode or left blank.");
  }
  if (built.student_dob.trim() && Number.isNaN(Date.parse(built.student_dob))) {
    errors.push("student_dob must be a valid date (YYYY-MM-DD).");
  }

  return errors;
}

export function toStudentImportRpcRow(row: CenterStudentImportRow): CenterStudentImportRpcRow {
  const payload: CenterStudentImportRpcRow = {
    student_name: row.student_name,
    parent_name: row.parent_name,
    whatsapp: row.whatsapp,
  };
  if (row.email) payload.email = row.email;
  if (row.student_dob) payload.student_dob = row.student_dob;
  if (row.login_email) payload.login_email = row.login_email;
  if (row.school_name) payload.school_name = row.school_name;
  if (row.address_line1) payload.address_line1 = row.address_line1;
  if (row.city) payload.city = row.city;
  if (row.state) payload.state = row.state;
  if (row.pincode) payload.pincode = row.pincode;
  if (row.program_name) payload.program_name = row.program_name;
  if (row.starting_level) payload.starting_level = row.starting_level;
  return payload;
}

export function parseCenterStudentImportCsv(text: string): CenterStudentImportPreview {
  let matrix: string[][];
  try {
    matrix = parseCsvText(text);
  } catch (err) {
    return { rows: [], validRows: [], fileError: err instanceof Error ? err.message : "Invalid CSV file." };
  }

  if (matrix.length < 2) {
    return { rows: [], validRows: [], fileError: "CSV must include a header row and at least one data row." };
  }

  const mappedFields = matrix[0].map((cell) => normalizeStudentImportHeader(cell));
  const recognized = mappedFields.filter(Boolean).length;

  if (recognized === 0) {
    return {
      rows: [],
      validRows: [],
      fileError: "Unrecognized CSV headers. Download the template and use the provided column names.",
    };
  }

  if (!mappedFields.includes("student_name") || !mappedFields.includes("parent_name") || !mappedFields.includes("whatsapp")) {
    return {
      rows: [],
      validRows: [],
      fileError: "CSV must include student_name, parent_name, and whatsapp columns.",
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > CENTER_STUDENT_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      validRows: [],
      fileError: `Too many rows (max ${CENTER_STUDENT_IMPORT_MAX_ROWS}).`,
    };
  }

  const parsedRows: ParsedCenterStudentImportRow[] = [];
  const validRows: CenterStudentImportRow[] = [];

  dataRows.forEach((cells, index) => {
    const values: Partial<CenterStudentImportRow> = {};
    mappedFields.forEach((field, colIndex) => {
      if (!field) return;
      values[field] = sanitizeImportCell(cells[colIndex] ?? "", 500);
    });

    const built = buildStudentImportRow(values);
    const errors = validateStudentImportRow(built);
    if (errors.length === 0) validRows.push(built);

    parsedRows.push({
      rowNumber: index + 2,
      values: built,
      errors,
    });
  });

  return { rows: parsedRows, validRows, fileError: null };
}

export function centerStudentImportTemplateCsv(): string {
  const header = TEMPLATE_HEADERS.join(",");
  const sample = TEMPLATE_HEADERS.map((field) => {
    const value = SAMPLE_ROW[field];
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",");
  return `\uFEFF${header}\n${sample}\n`;
}

export function downloadCenterStudentImportTemplate(centerSlug: string): void {
  downloadTextFile(
    centerStudentImportTemplateCsv(),
    `students-import-${centerSlug}.csv`,
    "text/csv;charset=utf-8"
  );
}

export { readImportCsvFile, validateImportFile };

export function summarizeStudentImportResult(result: {
  created: Array<{ row: number; student_id: string }>;
  skipped: Array<{ row: number; student_id?: string; message: string }>;
  errors: Array<{ row: number; message: string }>;
}): string {
  const parts: string[] = [];
  const createdCount = result.created.length;
  const skippedCount = result.skipped.length;
  const errorCount = result.errors.length;

  if (createdCount > 0) parts.push(`${createdCount} student${createdCount === 1 ? "" : "s"} imported`);
  if (skippedCount > 0) parts.push(`${skippedCount} already enrolled`);
  if (errorCount > 0) parts.push(`${errorCount} row${errorCount === 1 ? "" : "s"} failed`);

  return parts.length > 0 ? parts.join(". ") + "." : "No students imported.";
}

/** @internal exported for tests */
export { EMAIL_PATTERN, TEMPLATE_HEADERS };
