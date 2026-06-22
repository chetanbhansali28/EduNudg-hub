export type LegalDocument = {
  name: string;
  url: string;
  uploaded_at: string;
};

export const BRAND_TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "UTC", label: "UTC" },
] as const;

export function parseLegalDocuments(settings: Record<string, unknown> | undefined): LegalDocument[] {
  const raw = settings?.legal_documents;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const url = String(row.url ?? "").trim();
      const uploaded_at = String(row.uploaded_at ?? "").trim();
      if (!name || !url) return null;
      return { name, url, uploaded_at: uploaded_at || new Date().toISOString() };
    })
    .filter((item): item is LegalDocument => item !== null);
}

export function formatSettingsUpdated(iso: string | null | undefined, nowMs: number = Date.now()): string | null {
  if (!iso) return null;
  const diffMs = nowMs - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return null;

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "Last updated just now by Admin";
  if (hours < 24) return `Last updated ${hours} hour${hours === 1 ? "" : "s"} ago by Admin`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Last updated ${days} day${days === 1 ? "" : "s"} ago by Admin`;

  return `Last updated ${new Date(iso).toLocaleDateString()} by Admin`;
}

export function normalizeStaleLeadDays(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

export const LEGAL_UPLOAD_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
export const LEGAL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
