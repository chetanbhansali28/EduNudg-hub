import { formatInrFromPaise } from "@/lib/inrCurrency";
import { MERCHANDISE_PHOTO_MAX_SLOTS } from "@/lib/merchandiseProductPhotoStorage";

export type CatalogStatusBadge = {
  label: string;
  tone: "active" | "draft";
};

export function catalogStatusBadge(isActive: boolean): CatalogStatusBadge {
  return isActive ? { label: "Active", tone: "active" } : { label: "Draft", tone: "draft" };
}

const LEVEL_KIT_DESCRIPTIONS: Record<string, string> = {
  "level 1 kit":
    "Essential learning tools for foundational abacus training. Includes high-grade physical abacus, workbooks, and interactive portal access.",
  "level 2 kit":
    "Intermediate logic-building set. Focuses on multidigit calculations and mental math visualization techniques.",
};

export function catalogItemDescription(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Merchandise item available to franchise centers.";
  const known = LEVEL_KIT_DESCRIPTIONS[trimmed.toLowerCase()];
  if (known) return known;
  if (/level\s*\d+/i.test(trimmed)) {
    return `Learning materials and tools for ${trimmed}. Supplied to franchise centers for student enrollment.`;
  }
  return `${trimmed} — merchandise available to franchise centers for student orders.`;
}

export type CatalogPhotoCell =
  | { kind: "image"; slot: number; url: string }
  | { kind: "empty"; slot: number }
  | { kind: "upload"; slot: number };

export function buildCatalogPhotoCells(
  slots: string[],
  maxVisible: number = MERCHANDISE_PHOTO_MAX_SLOTS
): CatalogPhotoCell[] {
  const uploadIndex = slots.findIndex((url) => !url?.trim());
  const cells: CatalogPhotoCell[] = [];

  for (let i = 0; i < MERCHANDISE_PHOTO_MAX_SLOTS && cells.length < maxVisible; i++) {
    const slot = i + 1;
    const url = slots[i]?.trim();
    if (url) {
      cells.push({ kind: "image", slot, url });
      continue;
    }
    if (i === uploadIndex) {
      cells.push({ kind: "upload", slot });
      continue;
    }
    cells.push({ kind: "empty", slot });
  }

  return cells;
}

export function photoAssetsLabel(uploadedCount: number, max = MERCHANDISE_PHOTO_MAX_SLOTS): string {
  return `Product Assets (${uploadedCount}/${max} uploaded)`;
}

export function formatCatalogSku(sku: string): string {
  return `SKU: ${sku.trim() || "—"}`;
}

export function formatCatalogPrice(priceCents: number, currency: string, isActive: boolean): string {
  const formatted = formatInrFromPaise(priceCents, currency);
  return formatted;
}

export function catalogPriceClass(isActive: boolean): string {
  return isActive ? "ed-brand-merch-card__price--active" : "ed-brand-merch-card__price--draft";
}
