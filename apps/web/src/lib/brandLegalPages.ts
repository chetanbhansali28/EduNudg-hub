export type BrandLegalPageKind = "privacy" | "terms";

export type BrandLegalPageDocument = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  htmlUrl?: string;
  uploadedAt: string;
};

export type BrandLegalPages = {
  privacy?: BrandLegalPageDocument;
  terms?: BrandLegalPageDocument;
};

export const BRAND_LEGAL_PAGE_LABELS: Record<BrandLegalPageKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Use",
};

export const BRAND_LEGAL_UPLOAD_ACCEPT = ".pdf,.doc,.docx";
export const BRAND_LEGAL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export function parseBrandLegalPages(settings: Record<string, unknown> | undefined): BrandLegalPages {
  const raw = settings?.legal_pages;
  if (!raw || typeof raw !== "object") return {};
  return parseBrandLegalPagesRecord(raw as Record<string, unknown>);
}

export function parseBrandLegalPagesRecord(raw: Record<string, unknown>): BrandLegalPages {
  return {
    privacy: parseLegalPageDocument(raw.privacy),
    terms: parseLegalPageDocument(raw.terms),
  };
}

function parseLegalPageDocument(raw: unknown): BrandLegalPageDocument | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const fileName = String(row.fileName ?? row.name ?? "").trim();
  const fileUrl = String(row.fileUrl ?? row.url ?? "").trim();
  const mimeType = String(row.mimeType ?? "").trim();
  const htmlUrl = typeof row.htmlUrl === "string" ? row.htmlUrl.trim() : undefined;
  const uploadedAt = String(row.uploadedAt ?? row.uploaded_at ?? "").trim();
  if (!fileName || !fileUrl) return undefined;
  return {
    fileName,
    fileUrl,
    mimeType: mimeType || guessMimeType(fileName),
    htmlUrl: htmlUrl || undefined,
    uploadedAt: uploadedAt || new Date().toISOString(),
  };
}

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  return "application/octet-stream";
}

export function hasBrandLegalPage(pages: BrandLegalPages, kind: BrandLegalPageKind): boolean {
  const doc = pages[kind];
  return Boolean(doc?.fileUrl?.trim());
}

export function isPdfDocument(doc: BrandLegalPageDocument): boolean {
  return doc.mimeType.includes("pdf") || doc.fileName.toLowerCase().endsWith(".pdf");
}

export function isWordDocument(doc: BrandLegalPageDocument): boolean {
  const lower = doc.fileName.toLowerCase();
  return (
    doc.mimeType.includes("word") ||
    doc.mimeType.includes("msword") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
}

export function legalPageRenderUrl(doc: BrandLegalPageDocument): string {
  if (isWordDocument(doc) && doc.htmlUrl) return doc.htmlUrl;
  return doc.fileUrl;
}
