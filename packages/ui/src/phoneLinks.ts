/** Build a `tel:` href from a display phone string (spaces and formatting stripped). */
export function telHref(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}
