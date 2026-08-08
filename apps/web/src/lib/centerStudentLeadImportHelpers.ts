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

export const CENTER_STUDENT_LEAD_IMPORT_MAX_BYTES = FRANCHISE_CENTER_IMPORT_MAX_BYTES;
export const CENTER_STUDENT_LEAD_IMPORT_MAX_ROWS = FRANCHISE_CENTER_IMPORT_MAX_ROWS;

export type CenterStudentLeadImportField =
  | "parent_name"
  | "whatsapp"
  | "email"
  | "child_name"
  | "child_dob"
  | "city"
  | "pincode"
  | "school_name"
  | "notes";

export type CenterStudentLeadImportRow = Record<CenterStudentLeadImportField, string>;

export type ParsedCenterStudentLeadImportRow = {
  rowNumber: number;
  values: Partial<CenterStudentLeadImportRow>;
  errors: string[];
};

export type CenterStudentLeadImportPreview = {
  rows: ParsedCenterStudentLeadImportRow[];
  validRows: CenterStudentLeadImportRow[];
  fileError: string | null;
};

export type CenterStudentLeadImportRpcRow = {
  parent_name: string;
  whatsapp: string;
  email: string;
  child_name?: string;
  child_dob?: string;
  city?: string;
  pincode?: string;
  school_name?: string;
  notes?: string;
};

const TEMPLATE_HEADERS: CenterStudentLeadImportField[] = [
  "parent_name",
  "whatsapp",
  "email",
  "child_name",
  "child_dob",
  "city",
  "pincode",
  "school_name",
  "notes",
];

const HEADER_ALIASES: Record<string, CenterStudentLeadImportField> = {
  parent_name: "parent_name",
  "parent name": "parent_name",
  parent: "parent_name",
  whatsapp: "whatsapp",
  "whatsapp number": "whatsapp",
  parent_whatsapp: "whatsapp",
  phone: "whatsapp",
  "parent phone": "whatsapp",
  email: "email",
  "parent email": "email",
  child_name: "child_name",
  "child name": "child_name",
  "student name": "child_name",
  child_dob: "child_dob",
  "child dob": "child_dob",
  dob: "child_dob",
  "date of birth": "child_dob",
  city: "city",
  pincode: "pincode",
  school_name: "school_name",
  "school name": "school_name",
  notes: "notes",
};

const SAMPLE_ROW: CenterStudentLeadImportRow = {
  parent_name: "Priya Sharma",
  whatsapp: "+919876543210",
  email: "priya@example.com",
  child_name: "Aarav Sharma",
  child_dob: "2015-03-15",
  city: "Pune",
  pincode: "411001",
  school_name: "Delhi Public School",
  notes: "Walk-in enquiry",
};

const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;

export function normalizeLeadImportHeader(header: string): CenterStudentLeadImportField | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

export function buildLeadImportRow(values: Partial<CenterStudentLeadImportRow>): CenterStudentLeadImportRow {
  return {
    parent_name: sanitizeImportCell(values.parent_name ?? "", 200),
    whatsapp: sanitizeImportCell(values.whatsapp ?? "", 32),
    email: sanitizeImportCell(values.email ?? "", 320).toLowerCase(),
    child_name: sanitizeImportCell(values.child_name ?? "", 200),
    child_dob: sanitizeImportCell(values.child_dob ?? "", 32),
    city: sanitizeImportCell(values.city ?? "", 100),
    pincode: sanitizeImportCell(values.pincode ?? "", 12),
    school_name: sanitizeImportCell(values.school_name ?? "", 200),
    notes: sanitizeImportCell(values.notes ?? "", 1000),
  };
}

export function validateLeadImportRow(values: Partial<CenterStudentLeadImportRow>): string[] {
  const errors: string[] = [];
  const built = buildLeadImportRow(values);
  const pincode = built.pincode.trim();

  if (!built.parent_name.trim()) errors.push("parent_name is required.");
  if (!built.whatsapp.trim()) errors.push("whatsapp is required.");
  if (!built.email.trim()) errors.push("email is required.");
  else if (!EMAIL_PATTERN.test(built.email)) errors.push("email is not valid.");

  if (pincode && !isIndiaPincode(pincode)) {
    errors.push("pincode must be a 6-digit India pincode or left blank.");
  }

  if (built.child_dob.trim() && Number.isNaN(Date.parse(built.child_dob))) {
    errors.push("child_dob must be a valid date (YYYY-MM-DD).");
  }

  return errors;
}

export function toLeadImportRpcRow(row: CenterStudentLeadImportRow): CenterStudentLeadImportRpcRow {
  const payload: CenterStudentLeadImportRpcRow = {
    parent_name: row.parent_name,
    whatsapp: row.whatsapp,
    email: row.email,
  };
  if (row.child_name) payload.child_name = row.child_name;
  if (row.child_dob) payload.child_dob = row.child_dob;
  if (row.city) payload.city = row.city;
  if (row.pincode) payload.pincode = row.pincode;
  if (row.school_name) payload.school_name = row.school_name;
  if (row.notes) payload.notes = row.notes;
  return payload;
}

export function parseCenterStudentLeadImportCsv(text: string): CenterStudentLeadImportPreview {
  let matrix: string[][];
  try {
    matrix = parseCsvText(text);
  } catch (err) {
    return { rows: [], validRows: [], fileError: err instanceof Error ? err.message : "Invalid CSV file." };
  }

  if (matrix.length < 2) {
    return { rows: [], validRows: [], fileError: "CSV must include a header row and at least one data row." };
  }

  const mappedFields = matrix[0].map((cell) => normalizeLeadImportHeader(cell));
  const recognized = mappedFields.filter(Boolean).length;

  if (recognized === 0) {
    return {
      rows: [],
      validRows: [],
      fileError: "Unrecognized CSV headers. Download the template and use the provided column names.",
    };
  }

  if (!mappedFields.includes("parent_name") || !mappedFields.includes("whatsapp") || !mappedFields.includes("email")) {
    return {
      rows: [],
      validRows: [],
      fileError: "CSV must include parent_name, whatsapp, and email columns.",
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > CENTER_STUDENT_LEAD_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      validRows: [],
      fileError: `Too many rows (max ${CENTER_STUDENT_LEAD_IMPORT_MAX_ROWS}).`,
    };
  }

  const parsedRows: ParsedCenterStudentLeadImportRow[] = [];
  const validRows: CenterStudentLeadImportRow[] = [];

  dataRows.forEach((cells, index) => {
    const values: Partial<CenterStudentLeadImportRow> = {};
    mappedFields.forEach((field, colIndex) => {
      if (!field) return;
      values[field] = sanitizeImportCell(cells[colIndex] ?? "", 500);
    });

    const built = buildLeadImportRow(values);
    const errors = validateLeadImportRow(built);
    if (errors.length === 0) validRows.push(built);

    parsedRows.push({
      rowNumber: index + 2,
      values: built,
      errors,
    });
  });

  return { rows: parsedRows, validRows, fileError: null };
}

export function centerStudentLeadImportTemplateCsv(): string {
  const header = TEMPLATE_HEADERS.join(",");
  const sample = TEMPLATE_HEADERS.map((field) => {
    const value = SAMPLE_ROW[field];
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",");
  return `\uFEFF${header}\n${sample}\n`;
}

export function downloadCenterStudentLeadImportTemplate(centerSlug: string): void {
  downloadTextFile(
    centerStudentLeadImportTemplateCsv(),
    `student-leads-import-${centerSlug}.csv`,
    "text/csv;charset=utf-8"
  );
}

export { readImportCsvFile, validateImportFile };

export function summarizeLeadImportResult(result: {
  created: Array<{ row: number; lead_id: string }>;
  merged: Array<{ row: number; lead_id: string }>;
  errors: Array<{ row: number; message: string }>;
}): string {
  const parts: string[] = [];
  const createdCount = result.created.length;
  const mergedCount = result.merged.length;
  const errorCount = result.errors.length;

  if (createdCount > 0) parts.push(`${createdCount} lead${createdCount === 1 ? "" : "s"} created`);
  if (mergedCount > 0) parts.push(`${mergedCount} merged by WhatsApp`);
  if (errorCount > 0) parts.push(`${errorCount} row${errorCount === 1 ? "" : "s"} failed`);

  return parts.length > 0 ? parts.join(". ") + "." : "No leads imported.";
}

/** @internal exported for tests */
export { EMAIL_PATTERN, TEMPLATE_HEADERS };
