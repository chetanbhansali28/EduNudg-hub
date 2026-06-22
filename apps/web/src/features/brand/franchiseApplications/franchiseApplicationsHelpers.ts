import type { FranchiseInquiry } from "./FranchiseInquiryDetailCard";

export type InquiryFilter = "all" | "pending" | "decided";

export const INQUIRY_FILTER_OPTIONS: { value: InquiryFilter; label: string; mobileLabel: string }[] = [
  { value: "pending", label: "Pending review", mobileLabel: "Pending" },
  { value: "decided", label: "Decided", mobileLabel: "Decided" },
  { value: "all", label: "All applications", mobileLabel: "All" },
];

export function isPendingInquiry(row: FranchiseInquiry) {
  return row.status === "new" || row.status === "contacted" || row.status === "qualified";
}

export function inquiryListTitle(row: FranchiseInquiry): string {
  return row.proposed_franchise_name?.trim() || row.full_name;
}

export function inquiryLocationLine(row: FranchiseInquiry): string | null {
  const city = row.city?.trim();
  const state = row.state?.trim();
  if (city && state) return `${city}, ${state}`;
  return city ?? state ?? null;
}

export function inquiryMobileLocation(row: FranchiseInquiry): string | null {
  return row.city?.trim() ?? row.state?.trim() ?? null;
}

export function formatInquiryListDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatInquiryRelativeWhen(iso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(iso).getTime();
  if (diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatInquiryListDate(iso);
}

export type InquiryStatusPresentation = {
  label: string;
  tone: "new" | "pending" | "approved" | "rejected" | "neutral";
};

export function inquiryStatusPresentation(row: FranchiseInquiry): InquiryStatusPresentation {
  if (row.status === "new") return { label: "NEW", tone: "new" };
  if (isPendingInquiry(row)) return { label: "PENDING", tone: "pending" };
  if (row.converted_center_id) return { label: "APPROVED", tone: "approved" };
  if (row.status === "lost") return { label: "REJECTED", tone: "rejected" };
  return { label: row.status.toUpperCase(), tone: "neutral" };
}

const AVATAR_TONES = ["blue", "purple", "teal", "amber"] as const;

export type AvatarTone = (typeof AVATAR_TONES)[number];

export function inquiryAvatarTone(seed: string): AvatarTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? "blue";
}

export function filterInquiries(rows: FranchiseInquiry[], filter: InquiryFilter, search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "pending" && !isPendingInquiry(row)) return false;
    if (filter === "decided" && isPendingInquiry(row)) return false;
    if (!query) return true;

    const haystack = [
      inquiryListTitle(row),
      row.full_name,
      row.email,
      row.city,
      row.state,
      row.pincode,
      row.phone_e164,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function inquiryCounts(rows: FranchiseInquiry[]) {
  return {
    pending: rows.filter(isPendingInquiry).length,
    decided: rows.filter((row) => !isPendingInquiry(row)).length,
    all: rows.length,
  };
}

export function mapsSearchUrl(row: FranchiseInquiry): string | null {
  const parts = [row.address_line, row.city, row.state, row.pincode].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}
