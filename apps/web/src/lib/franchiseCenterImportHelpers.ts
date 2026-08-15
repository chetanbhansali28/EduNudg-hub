import { downloadTextFile } from "@/lib/platformDataExportHelpers";

export const FRANCHISE_CENTER_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const FRANCHISE_CENTER_IMPORT_MAX_ROWS = 500;

export type FranchiseCenterImportField =
  | "center_slug"
  | "name"
  | "city"
  | "display_name"
  | "region"
  | "country"
  | "address"
  | "pincode"
  | "contact_phone"
  | "short_description"
  | "owner_email";

export type FranchiseCenterImportRow = Record<FranchiseCenterImportField, string>;

export type ParsedFranchiseCenterImportRow = {
  rowNumber: number;
  values: Partial<FranchiseCenterImportRow>;
  errors: string[];
};

export type FranchiseCenterImportPreview = {
  rows: ParsedFranchiseCenterImportRow[];
  validRows: FranchiseCenterImportRow[];
  fileError: string | null;
};

export type FranchiseCenterImportRpcRow = {
  center_slug: string;
  name: string;
  city: string;
  display_name?: string;
  region?: string;
  country?: string;
  address?: string;
  pincode?: string;
  contact_phone?: string;
  short_description?: string;
  owner_email?: string;
};

const TEMPLATE_HEADERS: FranchiseCenterImportField[] = [
  "name",
  "city",
  "display_name",
  "region",
  "country",
  "address",
  "pincode",
  "contact_phone",
  "short_description",
  "owner_email",
];

const HEADER_ALIASES: Record<string, FranchiseCenterImportField> = {
  center_slug: "center_slug",
  "center slug": "center_slug",
  slug: "center_slug",
  name: "name",
  city: "city",
  display_name: "display_name",
  "display name": "display_name",
  region: "region",
  country: "country",
  address: "address",
  "address line1": "address",
  pincode: "pincode",
  contact_phone: "contact_phone",
  "contact phone": "contact_phone",
  phone: "contact_phone",
  short_description: "short_description",
  "short description": "short_description",
  owner_email: "owner_email",
  "owner email": "owner_email",
};

const SAMPLE_ROW: FranchiseCenterImportRow = {
  center_slug: "",
  name: "Mumbai Andheri Center",
  city: "Mumbai",
  display_name: "Abacus World Andheri",
  region: "Maharashtra",
  country: "IN",
  address: "123 Main Road",
  pincode: "400053",
  contact_phone: "+919876543210",
  short_description: "Abacus classes for ages 5–14",
  owner_email: "owner@example.com",
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const PINCODE_PATTERN = /^\d{4,12}$/;

export function normalizeImportHeader(header: string): FranchiseCenterImportField | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

/** Neutralize CSV formula-injection prefixes and strip control characters. */
export function sanitizeImportCell(value: string, maxLen: number): string {
  let text = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (/^[=+\-@\t]/.test(text)) {
    text = text.slice(1).trimStart();
  }
  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
  }
  return text;
}

export function slugifyImportSlug(value: string): string {
  return sanitizeImportCell(value, 48)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build a URL slug from franchise name (city fallback), uniqued against reserved values. */
export function deriveFranchiseCenterSlug(name: string, city: string, reserved: Set<string> = new Set()): string {
  const base = slugifyImportSlug(name) || slugifyImportSlug(city);
  if (!base || !SLUG_PATTERN.test(base)) return "";

  if (!reserved.has(base)) return base;

  for (let n = 2; n <= 999; n += 1) {
    const suffix = `-${n}`;
    const trimmed = base.slice(0, Math.max(1, 48 - suffix.length)).replace(/-+$/g, "");
    const candidate = `${trimmed}${suffix}`;
    if (SLUG_PATTERN.test(candidate) && !reserved.has(candidate)) return candidate;
  }

  return "";
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  cells.push(current);
  return cells;
}

export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === "\n") {
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
    } else if (ch === ",") {
      row.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  if (inQuotes) {
    throw new Error("CSV file has an unclosed quote.");
  }

  return rows;
}

export function validateImportFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv")) {
    return "Only .csv files are supported.";
  }
  if (file.size > FRANCHISE_CENTER_IMPORT_MAX_BYTES) {
    return "File is too large (max 2 MB).";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  return null;
}

export function validateImportRow(
  values: Partial<FranchiseCenterImportRow>,
  seenSlugs: Set<string>
): string[] {
  const errors: string[] = [];
  const name = sanitizeImportCell(values.name ?? "", 200);
  const city = sanitizeImportCell(values.city ?? "", 100);
  const slug = values.center_slug || deriveFranchiseCenterSlug(name, city, seenSlugs);
  const ownerEmail = sanitizeImportCell(values.owner_email ?? "", 320).toLowerCase();
  const pincode = sanitizeImportCell(values.pincode ?? "", 12);

  if (!name) errors.push("name is required.");
  if (!city) errors.push("city is required.");

  if (name && city && (!slug || !SLUG_PATTERN.test(slug))) {
    errors.push("Could not create a URL from the franchise name. Use letters or numbers in the name.");
  }

  if (ownerEmail && !EMAIL_PATTERN.test(ownerEmail)) {
    errors.push("owner_email is not a valid email address.");
  }

  if (pincode && !PINCODE_PATTERN.test(pincode)) {
    errors.push("pincode must be 4–12 digits.");
  }

  return errors;
}

export function buildImportRow(
  values: Partial<FranchiseCenterImportRow>,
  reservedSlugs: Set<string> = new Set()
): FranchiseCenterImportRow {
  const name = sanitizeImportCell(values.name ?? "", 200);
  const city = sanitizeImportCell(values.city ?? "", 100);
  return {
    center_slug: deriveFranchiseCenterSlug(name, city, reservedSlugs),
    name,
    city,
    display_name: sanitizeImportCell(values.display_name ?? "", 200),
    region: sanitizeImportCell(values.region ?? "", 100),
    country: sanitizeImportCell(values.country ?? "", 2) || "IN",
    address: sanitizeImportCell(values.address ?? "", 500),
    pincode: sanitizeImportCell(values.pincode ?? "", 12),
    contact_phone: sanitizeImportCell(values.contact_phone ?? "", 32),
    short_description: sanitizeImportCell(values.short_description ?? "", 500),
    owner_email: sanitizeImportCell(values.owner_email ?? "", 320).toLowerCase(),
  };
}

export function toRpcRow(row: FranchiseCenterImportRow): FranchiseCenterImportRpcRow {
  const payload: FranchiseCenterImportRpcRow = {
    center_slug: row.center_slug,
    name: row.name,
    city: row.city,
  };
  if (row.display_name) payload.display_name = row.display_name;
  if (row.region) payload.region = row.region;
  if (row.country) payload.country = row.country;
  if (row.address) payload.address = row.address;
  if (row.pincode) payload.pincode = row.pincode;
  if (row.contact_phone) payload.contact_phone = row.contact_phone;
  if (row.short_description) payload.short_description = row.short_description;
  if (row.owner_email) payload.owner_email = row.owner_email;
  return payload;
}

export function parseFranchiseCenterImportCsv(text: string): FranchiseCenterImportPreview {
  let matrix: string[][];
  try {
    matrix = parseCsvText(text);
  } catch (err) {
    return { rows: [], validRows: [], fileError: err instanceof Error ? err.message : "Invalid CSV file." };
  }

  if (matrix.length < 2) {
    return { rows: [], validRows: [], fileError: "CSV must include a header row and at least one data row." };
  }

  const mappedFields = matrix[0].map((cell) => normalizeImportHeader(cell));
  const recognized = mappedFields.filter(Boolean).length;

  if (recognized === 0) {
    return {
      rows: [],
      validRows: [],
      fileError: "Unrecognized CSV headers. Download the template and use the provided column names.",
    };
  }

  if (!mappedFields.includes("name") || !mappedFields.includes("city")) {
    return {
      rows: [],
      validRows: [],
      fileError: "CSV must include name and city columns.",
    };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > FRANCHISE_CENTER_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      validRows: [],
      fileError: `Too many rows (max ${FRANCHISE_CENTER_IMPORT_MAX_ROWS}).`,
    };
  }

  const seenSlugs = new Set<string>();
  const parsedRows: ParsedFranchiseCenterImportRow[] = [];
  const validRows: FranchiseCenterImportRow[] = [];

  dataRows.forEach((cells, index) => {
    const values: Partial<FranchiseCenterImportRow> = {};
    mappedFields.forEach((field, colIndex) => {
      if (!field) return;
      values[field] = sanitizeImportCell(cells[colIndex] ?? "", 500);
    });

    const built = buildImportRow(values, seenSlugs);
    const errors = validateImportRow(built, seenSlugs);
    if (errors.length === 0) {
      seenSlugs.add(built.center_slug);
      validRows.push(built);
    }

    parsedRows.push({
      rowNumber: index + 2,
      values: built,
      errors,
    });
  });

  return { rows: parsedRows, validRows, fileError: null };
}

export function franchiseCenterImportTemplateCsv(): string {
  const header = TEMPLATE_HEADERS.join(",");
  const sample = TEMPLATE_HEADERS.map((field) => {
    const value = SAMPLE_ROW[field];
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",");
  return `\uFEFF${header}\n${sample}\n`;
}

export function downloadFranchiseCenterImportTemplate(brandSlug: string): void {
  downloadTextFile(
    franchiseCenterImportTemplateCsv(),
    `franchise-centers-import-${brandSlug}.csv`,
    "text/csv;charset=utf-8"
  );
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  if (typeof FileReader === "undefined") {
    throw new Error("File reading is not supported in this environment.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

export async function readImportCsvFile(file: File): Promise<{ text: string | null; error: string | null }> {
  const fileError = validateImportFile(file);
  if (fileError) return { text: null, error: fileError };

  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { text: null, error: "Could not read file." };
  }

  if (text.includes("\0")) {
    return { text: null, error: "File appears to be binary, not a CSV text file." };
  }

  return { text, error: null };
}

/** @internal exported for tests */
export { parseCsvLine, SLUG_PATTERN, EMAIL_PATTERN };
